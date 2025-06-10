
// #ifdef RCT_NEW_ARCH_ENABLED
// #import "RNZowiesdkSpec.h"
//
// @interface Zowiesdk : NSObject <NativeZowiesdkSpec>
// #else
#import <React/RCTBridgeModule.h>

@interface Zowiesdk : NSObject <RCTBridgeModule>
// #endif

@end
