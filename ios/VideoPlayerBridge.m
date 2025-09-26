#import <Foundation/Foundation.h>
#import "VideoPlayerBridge.h"
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>
#import <AVKit/AVKit.h>
#import <AVFoundation/AVFoundation.h>

@interface VideoPlayerBridge() <RCTBridgeModule>
@end

@implementation VideoPlayerBridge
RCT_EXPORT_MODULE()

RCT_REMAP_METHOD(renderVideoFromUrl,
                 renderVideoFromUrl:(NSString *)urlString
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (urlString.length == 0) { reject(@"bad_args", @"Empty URL", nil); return; }
  NSURL *url = [NSURL URLWithString:urlString];
  if (!url) { reject(@"bad_args", @"Invalid URL", nil); return; }

  [self loadPlayableAssetURL:url attempts:2 delay:0.2 completion:^(AVURLAsset *asset) {
    if (!asset) { reject(@"not_playable", @"Asset not playable after retry", nil); return; }

    AVPlayerItem *item = [AVPlayerItem playerItemWithAsset:asset];
    [item addObserver:self forKeyPath:@"status"
              options:NSKeyValueObservingOptionInitial|NSKeyValueObservingOptionNew
              context:nil];

    dispatch_async(dispatch_get_main_queue(), ^{
      AVPlayer *player = [AVPlayer playerWithPlayerItem:item];
      AVPlayerViewController *vc = [AVPlayerViewController new];
      vc.player = player;
      vc.showsPlaybackControls = YES;
      vc.videoGravity = AVLayerVideoGravityResizeAspect;

      UIViewController *top = [self topViewController];
      if (!top) { reject(@"no_vc", @"No top ViewController", nil); return; }

      [top presentViewController:vc animated:YES completion:^{
        [player play];
        resolve(urlString);
      }];
    });
  }];
}

- (void)loadPlayableAssetURL:(NSURL *)url attempts:(NSInteger)attempts delay:(NSTimeInterval)delay completion:(void(^)(AVURLAsset *asset))completion {
  AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
  NSArray *keys = @[@"playable", @"tracks", @"duration"];

  [asset loadValuesAsynchronouslyForKeys:keys completionHandler:^{
    BOOL ok = YES;
    for (NSString *k in keys) {
      NSError *err = nil;
      if ([asset statusOfValueForKey:k error:&err] != AVKeyValueStatusLoaded) { ok = NO; break; }
    }
    if (ok && asset.playable) {
      completion(asset);
    } else if (attempts > 1) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delay * NSEC_PER_SEC)),
                     dispatch_get_main_queue(), ^{
        [self loadPlayableAssetURL:url attempts:(attempts - 1) delay:delay completion:completion];
      });
    } else {
      completion(nil);
    }
  }];
}

- (UIViewController *)topViewController {
  UIWindow *keyWindow = nil;
  if (@available(iOS 13.0, *)) {
    for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
      if (scene.activationState == UISceneActivationStateForegroundActive &&
          [scene isKindOfClass:UIWindowScene.class]) {
        for (UIWindow *w in ((UIWindowScene *)scene).windows) if (w.isKeyWindow) { keyWindow = w; break; }
        if (keyWindow) break;
      }
    }
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    keyWindow = UIApplication.sharedApplication.keyWindow;
#pragma clang diagnostic pop
  }
  UIViewController *top = keyWindow.rootViewController;
  while (top.presentedViewController) { top = top.presentedViewController; }
  return top;
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)obj change:(NSDictionary *)ch context:(void *)ctx {
  if ([obj isKindOfClass:[AVPlayerItem class]] && [keyPath isEqualToString:@"status"]) {
    AVPlayerItem *item = (AVPlayerItem *)obj;
    if (item.status == AVPlayerItemStatusFailed) {
      // NSLog(@"Player failed: %@", item.error);
    }
    @try { [item removeObserver:self forKeyPath:@"status"]; } @catch (__unused NSException *e) {}
  }
}
@end
