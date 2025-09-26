#import "ImagePickerUtilsZowie.h"

#import <PhotosUI/PhotosUI.h>
#import <AVFoundation/AVFoundation.h>
#import <React/RCTConvert.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h> // for iOS 14+
#import <MobileCoreServices/MobileCoreServices.h>         // fallback for iOS <14

// iOS 14+: new framework UTI
@import UniformTypeIdentifiers;

// iOS <14 fallback (MobileCoreServices is deprecated, backup)
#if __has_include(<MobileCoreServices/UTCoreTypes.h>)
#import <MobileCoreServices/UTCoreTypes.h>
#endif

@implementation ImagePickerUtilsZowie

+ (void)setupPickerFromOptions:(UIImagePickerController *)picker
                       options:(NSDictionary *)options
                        target:(RNImagePickerTarget)target
{
    if ([[options objectForKey:@"mediaType"] isEqualToString:@"video"]) {
        if ([[options objectForKey:@"videoQuality"] isEqualToString:@"high"]) {
            picker.videoQuality = UIImagePickerControllerQualityTypeHigh;
        } else if ([[options objectForKey:@"videoQuality"] isEqualToString:@"low"]) {
            picker.videoQuality = UIImagePickerControllerQualityTypeLow;
        } else {
            picker.videoQuality = UIImagePickerControllerQualityTypeMedium;
        }
    }

    if (target == camera) {
        picker.sourceType = UIImagePickerControllerSourceTypeCamera;

        if ([options[@"durationLimit"] doubleValue] > 0) {
            picker.videoMaximumDuration = [options[@"durationLimit"] doubleValue];
        }

        if ([options[@"cameraType"] isEqualToString:@"front"]) {
            picker.cameraDevice = UIImagePickerControllerCameraDeviceFront;
        } else {
            picker.cameraDevice = UIImagePickerControllerCameraDeviceRear;
        }
    } else {
        picker.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;
    }

    NSString *imageUTI = nil;
    NSString *movieUTI = nil;

    if (@available(iOS 14.0, *)) {
        imageUTI = UTTypeImage.identifier;
        movieUTI = UTTypeMovie.identifier;
    } else {
        #if __has_include(<MobileCoreServices/UTCoreTypes.h>)
        imageUTI = (NSString *)kUTTypeImage;
        movieUTI = (NSString *)kUTTypeMovie;
        #endif
    }

    NSString *mediaType = options[@"mediaType"];
    if ([mediaType isEqualToString:@"video"]) {
        if (movieUTI) picker.mediaTypes = @[movieUTI];
    } else if ([mediaType isEqualToString:@"photo"]) {
        if (imageUTI) picker.mediaTypes = @[imageUTI];
    } else if ([mediaType isEqualToString:@"mixed"]) {
        if (imageUTI && movieUTI) picker.mediaTypes = @[imageUTI, movieUTI];
    }

    picker.modalPresentationStyle = [RCTConvert UIModalPresentationStyle:options[@"presentationStyle"]];
}

+ (PHPickerConfiguration *)makeConfigurationFromOptions:(NSDictionary *)options
                                                 target:(RNImagePickerTarget)target
API_AVAILABLE(ios(14))
{
#if __has_include(<PhotosUI/PHPicker.h>)
    PHPickerConfiguration *configuration;

    if (options[@"includeExtra"]) {
        PHPhotoLibrary *photoLibrary = [PHPhotoLibrary sharedPhotoLibrary];
        configuration = [[PHPickerConfiguration alloc] initWithPhotoLibrary:photoLibrary];
    } else {
        configuration = [[PHPickerConfiguration alloc] init];
    }

    if ([[options objectForKey:@"assetRepresentationMode"] isEqualToString:@"current"]) {
        configuration.preferredAssetRepresentationMode = PHPickerConfigurationAssetRepresentationModeCurrent;
    } else if ([[options objectForKey:@"assetRepresentationMode"] isEqualToString:@"compatible"]) {
        configuration.preferredAssetRepresentationMode = PHPickerConfigurationAssetRepresentationModeCompatible;
    } else {
        configuration.preferredAssetRepresentationMode = PHPickerConfigurationAssetRepresentationModeAutomatic;
    }

    configuration.selectionLimit = [options[@"selectionLimit"] integerValue];

    NSString *mediaType = options[@"mediaType"];
    if ([mediaType isEqualToString:@"video"]) {
        configuration.filter = [PHPickerFilter videosFilter];
    } else if ([mediaType isEqualToString:@"photo"]) {
        configuration.filter = [PHPickerFilter imagesFilter];
    } else if ((target == library) && [mediaType isEqualToString:@"mixed"]) {
        configuration.filter = [PHPickerFilter anyFilterMatchingSubfilters:@[
            PHPickerFilter.imagesFilter, PHPickerFilter.videosFilter
        ]];
    }
    return configuration;
#else
    return nil;
#endif
}

+ (BOOL)isSimulator
{
#if TARGET_OS_SIMULATOR
    return YES;
#endif
    return NO;
}

+ (NSString*)getFileType:(NSData *)imageData
{
    const uint8_t firstByteJpg = 0xFF;
    const uint8_t firstBytePng = 0x89;
    const uint8_t firstByteGif = 0x47;

    uint8_t firstByte = 0;
    [imageData getBytes:&firstByte length:1];
    switch (firstByte) {
        case firstByteJpg: return @"jpg";
        case firstBytePng: return @"png";
        case firstByteGif: return @"gif";
        default: return @"jpg";
    }
}

+ (NSString *)getFileTypeFromUrl:(NSURL *)url
{
    NSString *ext = url.pathExtension;
    if (@available(iOS 14.0, *)) {
        UTType *t = [UTType typeWithFilenameExtension:ext];
        return t.preferredMIMEType ?: @"application/octet-stream";
    } else {
#if __has_include(<MobileCoreServices/UTCoreTypes.h>)
        CFStringRef fileExtension = (__bridge CFStringRef)ext;
        CFStringRef UTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, fileExtension, NULL);
        CFStringRef MIMEType = UTTypeCopyPreferredTagWithClass(UTI, kUTTagClassMIMEType);
        if (UTI) CFRelease(UTI);
        return (__bridge_transfer NSString *)MIMEType ?: @"application/octet-stream";
#else
        return @"application/octet-stream";
#endif
    }
}

+ (NSNumber *)getFileSizeFromUrl:(NSURL *)url
{
    NSError *attributesError = nil;
    NSDictionary *fileAttributes = [[NSFileManager defaultManager] attributesOfItemAtPath:url.path error:&attributesError];
    if (attributesError) {
        return nil;
    }
    NSNumber *fileSizeNumber = fileAttributes[NSFileSize];
    long long fileSize = [fileSizeNumber longLongValue];
    return @(fileSize);
}

+ (CGSize)getVideoDimensionsFromUrl:(NSURL *)url
{
    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
    NSArray<AVAssetTrack *> *tracks = [asset tracksWithMediaType:AVMediaTypeVideo];
    if (tracks.count > 0) {
        AVAssetTrack *track = tracks.firstObject;
        return track.naturalSize;
    }
    return CGSizeMake(0, 0);
}

+ (UIImage*)resizeImage:(UIImage*)image maxWidth:(float)maxWidth maxHeight:(float)maxHeight
{
    if ((maxWidth == 0) || (maxHeight == 0)) {
        return image;
    }
    if (image.size.width <= maxWidth && image.size.height <= maxHeight) {
        return image;
    }

    CGSize newSize = image.size;
    if (maxWidth < newSize.width) {
        newSize = CGSizeMake(maxWidth, (maxWidth / newSize.width) * newSize.height);
    }
    if (maxHeight < newSize.height) {
        newSize = CGSizeMake((maxHeight / newSize.height) * newSize.width, maxHeight);
    }

    newSize.width = (int)newSize.width;
    newSize.height = (int)newSize.height;

    UIGraphicsBeginImageContextWithOptions(newSize, NO, 1.0);
    [image drawInRect:CGRectMake(0, 0, newSize.width, newSize.height)];
    UIImage *newImage = UIGraphicsGetImageFromCurrentImageContext();
    if (newImage == nil) {
        NSLog(@"could not scale image");
    }
    UIGraphicsEndImageContext();

    return newImage;
}

+ (PHAsset *)fetchPHAssetOnIOS13:(NSDictionary<NSString *,id> *)info
{
    NSURL *referenceURL = info[UIImagePickerControllerReferenceURL];
    if (!referenceURL) {
        return nil;
    }
    // iOS 10-13: ALAsset URL → PHAsset
    PHFetchResult *fetchResult = [PHAsset fetchAssetsWithALAssetURLs:@[referenceURL] options:nil];
    return fetchResult.firstObject;
}

@end
