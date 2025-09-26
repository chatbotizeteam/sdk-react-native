#import "Zowiesdk.h"
#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@implementation Zowiesdk
RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue {
  return dispatch_queue_create("com.zowie.sdk.thumbnail.queue", DISPATCH_QUEUE_CONCURRENT);
}
+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(generateThumbnailFromURL:(NSString *)videoURL
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (videoURL.length == 0) {
    reject(@"E_INVALID_URL", @"Empty videoURL", nil);
    return;
  }

  NSString *encoded = [videoURL stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLFragmentAllowedCharacterSet]];

  NSURL *url = nil;
  if ([encoded hasPrefix:@"http://"] || [encoded hasPrefix:@"https://"] || [encoded hasPrefix:@"file://"]) {
    url = [NSURL URLWithString:encoded];
  } else {
    url = [NSURL fileURLWithPath:encoded];
  }
  if (!url) {
    reject(@"E_INVALID_URL", @"Unable to parse videoURL", nil);
    return;
  }

  NSDictionary *options = @{
    AVURLAssetAllowsConstrainedNetworkAccessKey: @YES,
    AVURLAssetAllowsExpensiveNetworkAccessKey: @YES,
    AVURLAssetPreferPreciseDurationAndTimingKey: @NO
  };
  AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:options];

  NSArray<NSString *> *keys = @[@"tracks", @"duration"];
  [asset loadValuesAsynchronouslyForKeys:keys completionHandler:^{
    NSError *keyError = nil;
    for (NSString *key in keys) {
      AVKeyValueStatus status = [asset statusOfValueForKey:key error:&keyError];
      if (status == AVKeyValueStatusFailed || status == AVKeyValueStatusCancelled) {
        reject(@"E_ASSET_LOAD", [NSString stringWithFormat:@"Failed loading key: %@", key], keyError);
        return;
      }
    }

    AVAssetTrack *videoTrack = [[asset tracksWithMediaType:AVMediaTypeVideo] firstObject];
    if (!videoTrack) {
      reject(@"E_NO_VIDEO_TRACK", @"No video track in asset", nil);
      return;
    }

    AVAssetImageGenerator *imageGenerator = [AVAssetImageGenerator assetImageGeneratorWithAsset:asset];
    imageGenerator.appliesPreferredTrackTransform = YES;
    imageGenerator.requestedTimeToleranceBefore = kCMTimeZero;
    imageGenerator.requestedTimeToleranceAfter  = kCMTimeZero;

    CGSize ns = videoTrack.naturalSize;
    CGAffineTransform pt = videoTrack.preferredTransform;
    CGSize oriented = CGSizeApplyAffineTransform(ns, pt);
    CGSize natural = CGSizeMake(fabs(oriented.width), fabs(oriented.height));

    CGFloat maxLongestEdge = 640.0;
    if (natural.width > 0 && natural.height > 0) {
      CGFloat longest = MAX(natural.width, natural.height);
      CGFloat scale = MIN(maxLongestEdge / longest, 1.0);
      if (scale < 1.0) {
        CGSize target = CGSizeMake(floor(natural.width * scale), floor(natural.height * scale));
        imageGenerator.maximumSize = target;
      }
    }

    CMTime time = CMTimeMakeWithSeconds(1.0, 600);
    NSError *thumbError = nil;
    CGImageRef imageRef = [imageGenerator copyCGImageAtTime:time actualTime:NULL error:&thumbError];
    if (thumbError || !imageRef) {
      reject(@"THUMBNAIL_ERROR", @"Unable to generate thumbnail", thumbError);
      return;
    }

    UIImage *thumbnail = [UIImage imageWithCGImage:imageRef];
    CGImageRelease(imageRef);

    NSData *imageData = UIImageJPEGRepresentation(thumbnail, 0.8);
    if (!imageData) {
      reject(@"E_ENCODING", @"Failed to encode thumbnail", nil);
      return;
    }
    NSString *base64 = [imageData base64EncodedStringWithOptions:0];
    resolve(base64);
  }];
}

@end
