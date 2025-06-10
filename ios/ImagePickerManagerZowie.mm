#import "ImagePickerManagerZowie.h"
#import "ImagePickerUtilsZowie.h"
#import <React/RCTConvert.h>
#import <AVFoundation/AVFoundation.h>
#import <Photos/Photos.h>
#import <PhotosUI/PhotosUI.h>
#import <MobileCoreServices/MobileCoreServices.h>

@interface ImagePickerManagerZowie ()

@property (nonatomic, strong) RCTResponseSenderBlock callback;
@property (nonatomic, copy) NSDictionary *options;

@end

@interface ImagePickerManagerZowie (UIImagePickerControllerDelegate) <UINavigationControllerDelegate, UIImagePickerControllerDelegate>
@end

@interface ImagePickerManagerZowie (UIAdaptivePresentationControllerDelegate) <UIAdaptivePresentationControllerDelegate>
@end

#if __has_include(<PhotosUI/PHPicker.h>)
@interface ImagePickerManagerZowie (PHPickerViewControllerDelegate) <PHPickerViewControllerDelegate>
@end
#endif

@implementation ImagePickerManagerZowie

NSString *errCameraUnavailableZowie = @"camera_unavailable";
NSString *errPermissionZowie = @"permission";
NSString *errOthersZowie = @"others";
RNImagePickerTarget targetZowie;

BOOL photoSelectedZowie = NO;

RCT_EXPORT_MODULE(ImagePickerZowie)

RCT_EXPORT_METHOD(launchCamera:(NSDictionary *)options callback:(RCTResponseSenderBlock)callback)
{
    targetZowie = camera;
    photoSelectedZowie = NO;
    dispatch_async(dispatch_get_main_queue(), ^{
        [self launchImagePicker:options callback:callback];
    });
}

RCT_EXPORT_METHOD(launchImageLibrary:(NSDictionary *)options callback:(RCTResponseSenderBlock)callback)
{
    targetZowie = library;
    photoSelectedZowie = NO;
    dispatch_async(dispatch_get_main_queue(), ^{
        [self launchImagePicker:options callback:callback];
    });
}

// We won't compile this code when we build for the old architecture.
// #ifdef RCT_NEW_ARCH_ENABLED
//
// - (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
//     (const facebook::react::ObjCTurboModule::InitParams &)params
// {
//     return std::make_shared<facebook::react::NativeImagePickerSpecJSI>(params);
// }
// #endif

- (void)launchImagePicker:(NSDictionary *)options callback:(RCTResponseSenderBlock)callback
{
    self.callback = callback;

    if (targetZowie == camera && [ImagePickerUtilsZowie isSimulator]) {
        self.callback(@[@{@"errorCode": errCameraUnavailableZowie}]);
        return;
    }

    self.options = options;

#if __has_include(<PhotosUI/PHPicker.h>)
    if (@available(iOS 14, *)) {
        if (targetZowie == library) {
            PHPickerConfiguration *configuration = [ImagePickerUtilsZowie makeConfigurationFromOptions:options target:targetZowie];
            PHPickerViewController *picker = [[PHPickerViewController alloc] initWithConfiguration:configuration];
            picker.delegate = self;
            picker.modalPresentationStyle = [RCTConvert UIModalPresentationStyle:options[@"presentationStyle"]];
            picker.presentationController.delegate = self;

            if([self.options[@"includeExtra"] boolValue]) {

                [self checkPhotosPermissions:^(BOOL granted) {
                    if (!granted) {
                        self.callback(@[@{@"errorCode": errPermissionZowie}]);
                        return;
                    }
                    [self showPickerViewController:picker];
                }];
            } else {
                [self showPickerViewController:picker];
            }

            return;
        }
    }
#endif
    UIImagePickerController *picker = [[UIImagePickerController alloc] init];
    [ImagePickerUtilsZowie setupPickerFromOptions:picker options:self.options target:targetZowie];
    picker.delegate = self;
    picker.presentationController.delegate = self;

    if([self.options[@"includeExtra"] boolValue]) {
        [self checkPhotosPermissions:^(BOOL granted) {
            if (!granted) {
                self.callback(@[@{@"errorCode": errPermissionZowie}]);
                return;
            }
            [self showPickerViewController:picker];
        }];
    } else {
      [self showPickerViewController:picker];
    }
}

- (void) showPickerViewController:(UIViewController *)picker
{
    dispatch_async(dispatch_get_main_queue(), ^{
        UIViewController *root = RCTPresentedViewController();
        [root presentViewController:picker animated:YES completion:nil];
    });
}

#pragma mark - Helpers

NSData* extractImageDataZowie(UIImage* image){
    CFMutableDataRef imageData = CFDataCreateMutable(NULL, 0);
    CGImageDestinationRef destination = CGImageDestinationCreateWithData(imageData, kUTTypeJPEG, 1, NULL);

    CFStringRef orientationKey[1];
    CFTypeRef   orientationValue[1];
    CGImagePropertyOrientation CGOrientation = CGImagePropertyOrientationForUIImageOrientationZowie(image.imageOrientation);

    orientationKey[0] = kCGImagePropertyOrientation;
    orientationValue[0] = CFNumberCreate(NULL, kCFNumberIntType, &CGOrientation);

    CFDictionaryRef imageProps = CFDictionaryCreate( NULL, (const void **)orientationKey, (const void **)orientationValue, 1,
                    &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);

    CGImageDestinationAddImage(destination, image.CGImage, imageProps);

    CGImageDestinationFinalize(destination);

    CFRelease(destination);
    CFRelease(orientationValue[0]);
    CFRelease(imageProps);
    return (__bridge NSData *)imageData;
}



-(NSMutableDictionary *)mapImageToAsset:(UIImage *)image data:(NSData *)data phAsset:(PHAsset * _Nullable)phAsset {
    NSString *fileType = [ImagePickerUtilsZowie getFileType:data];
    if (targetZowie == camera) {
        if ([self.options[@"saveToPhotos"] boolValue]) {
            UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil);
        }
        data = extractImageDataZowie(image);
    }

    UIImage* newImage = image;
    if (![fileType isEqualToString:@"gif"]) {
        newImage = [ImagePickerUtilsZowie resizeImage:image
                                     maxWidth:[self.options[@"maxWidth"] floatValue]
                                    maxHeight:[self.options[@"maxHeight"] floatValue]];
    }

    float quality = [self.options[@"quality"] floatValue];
    if (![image isEqual:newImage] || (quality >= 0 && quality < 1)) {
        if ([fileType isEqualToString:@"jpg"]) {
            data = UIImageJPEGRepresentation(newImage, quality);
        } else if ([fileType isEqualToString:@"png"]) {
            data = UIImagePNGRepresentation(newImage);
        }
    }

    NSMutableDictionary *asset = [[NSMutableDictionary alloc] init];
    asset[@"type"] = [@"image/" stringByAppendingString:fileType];

    NSString *fileName = [self getImageFileName:fileType];
    NSString *path = [[NSTemporaryDirectory() stringByStandardizingPath] stringByAppendingPathComponent:fileName];
    [data writeToFile:path atomically:YES];

    if ([self.options[@"includeBase64"] boolValue]) {
        asset[@"base64"] = [data base64EncodedStringWithOptions:0];
    }

    NSURL *fileURL = [NSURL fileURLWithPath:path];
    asset[@"uri"] = [fileURL absoluteString];

    NSNumber *fileSizeValue = nil;
    NSError *fileSizeError = nil;
    [fileURL getResourceValue:&fileSizeValue forKey:NSURLFileSizeKey error:&fileSizeError];
    if (fileSizeValue){
        asset[@"fileSize"] = fileSizeValue;
    }

    asset[@"fileName"] = fileName;
    asset[@"width"] = @(newImage.size.width);
    asset[@"height"] = @(newImage.size.height);

    if(phAsset){
        asset[@"timestamp"] = [self getDateTimeInUTC:phAsset.creationDate];
        asset[@"id"] = phAsset.localIdentifier;
        // Add more extra data here ...
    }

    return asset;
}

CGImagePropertyOrientation CGImagePropertyOrientationForUIImageOrientationZowie(UIImageOrientation uiOrientation) {
    //code from here: https://developer.apple.com/documentation/imageio/cgimagepropertyorientation?language=objc
    switch (uiOrientation) {
        case UIImageOrientationUp: return kCGImagePropertyOrientationUp;
        case UIImageOrientationDown: return kCGImagePropertyOrientationDown;
        case UIImageOrientationLeft: return kCGImagePropertyOrientationLeft;
        case UIImageOrientationRight: return kCGImagePropertyOrientationRight;
        case UIImageOrientationUpMirrored: return kCGImagePropertyOrientationUpMirrored;
        case UIImageOrientationDownMirrored: return kCGImagePropertyOrientationDownMirrored;
        case UIImageOrientationLeftMirrored: return kCGImagePropertyOrientationLeftMirrored;
        case UIImageOrientationRightMirrored: return kCGImagePropertyOrientationRightMirrored;
    }
}

-(NSMutableDictionary *)mapVideoToAsset:(NSURL *)url phAsset:(PHAsset * _Nullable)phAsset error:(NSError **)error {
    NSString *fileName = [url lastPathComponent];
    NSString *path = [[NSTemporaryDirectory() stringByStandardizingPath] stringByAppendingPathComponent:fileName];
    NSURL *videoDestinationURL = [NSURL fileURLWithPath:path];
    NSString *fileExtension = [fileName pathExtension];

    if ((targetZowie == camera) && [self.options[@"saveToPhotos"] boolValue]) {
        UISaveVideoAtPathToSavedPhotosAlbum(url.path, nil, nil, nil);
    }

    if (![url.URLByResolvingSymlinksInPath.path isEqualToString:videoDestinationURL.URLByResolvingSymlinksInPath.path]) {
        NSFileManager *fileManager = [NSFileManager defaultManager];

        // Delete file if it already exists
        if ([fileManager fileExistsAtPath:videoDestinationURL.path]) {
            [fileManager removeItemAtURL:videoDestinationURL error:nil];
        }

        if (url) { // Protect against reported crash

          // If we have write access to the source file, move it. Otherwise use copy.
          if ([fileManager isWritableFileAtPath:[url path]]) {
            [fileManager moveItemAtURL:url toURL:videoDestinationURL error:error];
          } else {
            [fileManager copyItemAtURL:url toURL:videoDestinationURL error:error];
          }

          if (error && *error) {
              return nil;
          }
        }
    }

    NSMutableDictionary *response = [[NSMutableDictionary alloc] init];

    if([self.options[@"formatAsMp4"] boolValue] && ![fileExtension isEqualToString:@"mp4"]) {
        NSURL *parentURL = [videoDestinationURL URLByDeletingLastPathComponent];
        NSString *path = [[parentURL.path stringByAppendingString:@"/"] stringByAppendingString:[[NSUUID UUID] UUIDString]];
        path = [path stringByAppendingString:@".mp4"];
        NSURL *outputURL = [NSURL fileURLWithPath:path];

        [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];
        AVURLAsset *asset = [AVURLAsset URLAssetWithURL:videoDestinationURL options:nil];
        AVAssetExportSession *exportSession = [[AVAssetExportSession alloc] initWithAsset:asset presetName:AVAssetExportPresetPassthrough];

        exportSession.outputURL = outputURL;
        exportSession.outputFileType = AVFileTypeMPEG4;
        exportSession.shouldOptimizeForNetworkUse = YES;

        dispatch_semaphore_t sem = dispatch_semaphore_create(0);

        [exportSession exportAsynchronouslyWithCompletionHandler:^(void) {
            if (exportSession.status == AVAssetExportSessionStatusCompleted) {
                CGSize dimentions = [ImagePickerUtilsZowie getVideoDimensionsFromUrl:outputURL];
                response[@"fileName"] = [outputURL lastPathComponent];
                response[@"duration"] = [NSNumber numberWithDouble:CMTimeGetSeconds([AVAsset assetWithURL:outputURL].duration)];
                response[@"uri"] = outputURL.absoluteString;
                response[@"type"] = [ImagePickerUtilsZowie getFileTypeFromUrl:outputURL];
                response[@"fileSize"] = [ImagePickerUtilsZowie getFileSizeFromUrl:outputURL];
                response[@"width"] = @(dimentions.width);
                response[@"height"] = @(dimentions.height);

                dispatch_semaphore_signal(sem);
            } else if (exportSession.status == AVAssetExportSessionStatusFailed || exportSession.status == AVAssetExportSessionStatusCancelled) {
                dispatch_semaphore_signal(sem);
            }
        }];


        dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);
    } else {
        CGSize dimentions = [ImagePickerUtilsZowie getVideoDimensionsFromUrl:videoDestinationURL];
        response[@"fileName"] = fileName;
        response[@"duration"] = [NSNumber numberWithDouble:CMTimeGetSeconds([AVAsset assetWithURL:videoDestinationURL].duration)];
        response[@"uri"] = videoDestinationURL.absoluteString;
        response[@"type"] = [ImagePickerUtilsZowie getFileTypeFromUrl:videoDestinationURL];
        response[@"fileSize"] = [ImagePickerUtilsZowie getFileSizeFromUrl:videoDestinationURL];
        response[@"width"] = @(dimentions.width);
        response[@"height"] = @(dimentions.height);

        if(phAsset){
            response[@"timestamp"] = [self getDateTimeInUTC:phAsset.creationDate];
            response[@"id"] = phAsset.localIdentifier;
            // Add more extra data here ...
        }
    }

    return response;
}

- (NSString *) getDateTimeInUTC:(NSDate *)date {
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZ"];
    return [formatter stringFromDate:date];
}

- (void)checkCameraPermissions:(void(^)(BOOL granted))callback
{
    AVAuthorizationStatus status = [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];
    if (status == AVAuthorizationStatusAuthorized) {
        callback(YES);
        return;
    }
    else if (status == AVAuthorizationStatusNotDetermined){
        [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
            callback(granted);
            return;
        }];
    }
    else {
        callback(NO);
    }
}

- (void)checkPhotosPermissions:(void(^)(BOOL granted))callback
{
    PHAuthorizationStatus status = [PHPhotoLibrary authorizationStatus];
    if (status == PHAuthorizationStatusAuthorized) {
        callback(YES);
        return;
    } else if (status == PHAuthorizationStatusNotDetermined) {
        [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
            if (status == PHAuthorizationStatusAuthorized) {
                callback(YES);
                return;
            }
            else {
                callback(NO);
                return;
            }
        }];
    }
    else {
        callback(NO);
    }
}

// Both camera and photo write permission is required to take picture/video and store it to public photos
- (void)checkCameraAndPhotoPermission:(void(^)(BOOL granted))callback
{
    [self checkCameraPermissions:^(BOOL cameraGranted) {
        if (!cameraGranted) {
            callback(NO);
            return;
        }

        [self checkPhotosPermissions:^(BOOL photoGranted) {
            if (!photoGranted) {
                callback(NO);
                return;
            }
            callback(YES);
        }];
    }];
}

- (void)checkPermission:(void(^)(BOOL granted)) callback
{
    void (^permissionBlock)(BOOL) = ^(BOOL permissionGranted) {
        if (!permissionGranted) {
            callback(NO);
            return;
        }
        callback(YES);
    };

    if (targetZowie == camera && [self.options[@"saveToPhotos"] boolValue]) {
        [self checkCameraAndPhotoPermission:permissionBlock];
    }
    else if (targetZowie == camera) {
        [self checkCameraPermissions:permissionBlock];
    }
    else {
        if (@available(iOS 11.0, *)) {
            callback(YES);
        }
        else {
            [self checkPhotosPermissions:permissionBlock];
        }
    }
}

- (NSString *)getImageFileName:(NSString *)fileType
{
    NSString *fileName = [[NSUUID UUID] UUIDString];
    fileName = [fileName stringByAppendingString:@"."];
    return [fileName stringByAppendingString:fileType];
}

+ (UIImage *)getUIImageFromInfo:(NSDictionary *)info
{
    UIImage *image = info[UIImagePickerControllerEditedImage];
    if (!image) {
        image = info[UIImagePickerControllerOriginalImage];
    }
    return image;
}

+ (NSURL *)getNSURLFromInfo:(NSDictionary *)info {
    if (@available(iOS 11.0, *)) {
        return info[UIImagePickerControllerImageURL];
    }
    else {
        return info[UIImagePickerControllerReferenceURL];
    }
}

@end

@implementation ImagePickerManagerZowie (UIImagePickerControllerDelegate)

- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary<NSString *,id> *)info
{
    dispatch_block_t dismissCompletionBlock = ^{
        NSMutableArray<NSDictionary *> *assets = [[NSMutableArray alloc] initWithCapacity:1];
        PHAsset *asset = nil;

        if (photoSelectedZowie == YES) {
           return;
        }
        photoSelectedZowie = YES;

        // If include extra, we fetch the PHAsset, this required library permissions
        if([self.options[@"includeExtra"] boolValue]) {
          asset = [ImagePickerUtilsZowie fetchPHAssetOnIOS13:info];
        }

        if ([info[UIImagePickerControllerMediaType] isEqualToString:(NSString *) kUTTypeImage]) {
            UIImage *image = [ImagePickerManagerZowie getUIImageFromInfo:info];

            [assets addObject:[self mapImageToAsset:image data:[NSData dataWithContentsOfURL:[ImagePickerManagerZowie getNSURLFromInfo:info]] phAsset:asset]];
        } else {
            NSError *error;
            NSDictionary *videoAsset = [self mapVideoToAsset:info[UIImagePickerControllerMediaURL] phAsset:asset error:&error];

            if (videoAsset == nil) {
                NSString *errorMessage = error.localizedFailureReason;
                if (errorMessage == nil) errorMessage = @"Video asset not found";
                self.callback(@[@{@"errorCode": errOthersZowie, @"errorMessage": errorMessage}]);
                return;
            }
            [assets addObject:videoAsset];
        }

        NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
        response[@"assets"] = assets;
        self.callback(@[response]);
    };

    dispatch_async(dispatch_get_main_queue(), ^{
        [picker dismissViewControllerAnimated:YES completion:dismissCompletionBlock];
    });
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [picker dismissViewControllerAnimated:YES completion:^{
            self.callback(@[@{@"didCancel": @YES}]);
        }];
    });
}

@end

@implementation ImagePickerManagerZowie (presentationControllerDidDismiss)

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
    self.callback(@[@{@"didCancel": @YES}]);
}

@end

#if __has_include(<PhotosUI/PHPicker.h>)
@implementation ImagePickerManagerZowie (PHPickerViewControllerDelegate)

- (void)picker:(PHPickerViewController *)picker didFinishPicking:(NSArray<PHPickerResult *> *)results API_AVAILABLE(ios(14))
{
    [picker dismissViewControllerAnimated:YES completion:nil];

    if (photoSelectedZowie == YES) {
        return;
    }
    photoSelectedZowie = YES;

    if (results.count == 0) {
        dispatch_async(dispatch_get_main_queue(), ^{
            self.callback(@[@{@"didCancel": @YES}]);
        });
        return;
    }

    dispatch_group_t completionGroup = dispatch_group_create();
    NSMutableArray<NSDictionary *> *assets = [[NSMutableArray alloc] initWithCapacity:results.count];
    for (int i = 0; i < results.count; i++) {
        [assets addObject:(NSDictionary *)[NSNull null]];
    }

    [results enumerateObjectsUsingBlock:^(PHPickerResult *result, NSUInteger index, BOOL *stop) {
        PHAsset *asset = nil;
        NSItemProvider *provider = result.itemProvider;

        // If include extra, we fetch the PHAsset, this required library permissions
        if([self.options[@"includeExtra"] boolValue] && result.assetIdentifier != nil) {
            PHFetchResult* fetchResult = [PHAsset fetchAssetsWithLocalIdentifiers:@[result.assetIdentifier] options:nil];
            asset = fetchResult.firstObject;
        }

        dispatch_group_enter(completionGroup);

        if ([provider hasItemConformingToTypeIdentifier:(NSString *)kUTTypeImage]) {
            NSString *identifier = provider.registeredTypeIdentifiers.firstObject;
            // Matches both com.apple.live-photo-bundle and com.apple.private.live-photo-bundle
            if ([identifier containsString:@"live-photo-bundle"]) {
                // Handle live photos
                identifier = @"public.jpeg";
            }

            [provider loadFileRepresentationForTypeIdentifier:identifier completionHandler:^(NSURL * _Nullable url, NSError * _Nullable error) {
                NSData *data = [[NSData alloc] initWithContentsOfURL:url];
                UIImage *image = [[UIImage alloc] initWithData:data];

                assets[index] = [self mapImageToAsset:image data:data phAsset:asset];
                dispatch_group_leave(completionGroup);
            }];
        } else if ([provider hasItemConformingToTypeIdentifier:(NSString *)kUTTypeMovie]) {
            [provider loadFileRepresentationForTypeIdentifier:(NSString *)kUTTypeMovie completionHandler:^(NSURL * _Nullable url, NSError * _Nullable error) {
                NSDictionary *mappedAsset = [self mapVideoToAsset:url phAsset:asset error:nil];
                if (nil != mappedAsset) {
                    assets[index] = mappedAsset;
                }
                dispatch_group_leave(completionGroup);
            }];
        } else {
            // The provider didn't have an item matching photo or video (fails on M1 Mac Simulator)
            dispatch_group_leave(completionGroup);
        }
    }];

    dispatch_group_notify(completionGroup, dispatch_get_main_queue(), ^{
        //  mapVideoToAsset can fail and return nil, leaving asset NSNull.
        for (NSDictionary *asset in assets) {
            if ([asset isEqual:[NSNull null]]) {
                self.callback(@[@{@"errorCode": errOthersZowie}]);
                return;
            }
        }

        NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
        [response setObject:assets forKey:@"assets"];

        self.callback(@[response]);
    });
}

@end

#endif
