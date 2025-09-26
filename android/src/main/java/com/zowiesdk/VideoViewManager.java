package com.zowiesdk;

import android.app.Dialog;
import android.graphics.Color;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.MediaController;
import android.widget.ProgressBar;
import android.widget.VideoView;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import android.media.MediaPlayer;

public class VideoViewManager extends SimpleViewManager<FrameLayout> {
  public static final String REACT_CLASS = "VideoView";

  @Nullable private Dialog fullscreenDialog;
  @Nullable private VideoView activeVideoView;
  @Nullable private ProgressBar loadingSpinner;

  private String currentUrl;
  private boolean wantsToPlay = false;
  private int playToken = 0;
  private final Handler main = new Handler(Looper.getMainLooper());

  @Override public String getName() { return REACT_CLASS; }

  @Override
  protected FrameLayout createViewInstance(ThemedReactContext reactContext) {
    FrameLayout placeholder = new FrameLayout(reactContext);
    placeholder.setLayoutParams(new FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    return placeholder;
  }

  @ReactProp(name="url")
  public void setVideoPath(FrameLayout view, String urlPath) {
    if ((currentUrl == null && urlPath == null) ||
        (currentUrl != null && currentUrl.equals(urlPath))) {
      return;
    }
    currentUrl = urlPath;

    if (wantsToPlay && currentUrl != null && !currentUrl.isEmpty()) {
      wantsToPlay = false;
      ThemedReactContext ctx = (ThemedReactContext) view.getContext();
      main.post(() -> openFullscreenDialog(ctx, currentUrl));
    }
  }

  @ReactProp(name="isPlaying")
  public void setPauseOrPlay(FrameLayout view, Boolean isPlaying) {
    ThemedReactContext ctx = (ThemedReactContext) view.getContext();
    if (Boolean.TRUE.equals(isPlaying)) {
      if (currentUrl == null || currentUrl.isEmpty()) {
        wantsToPlay = true;
        return;
      }
      wantsToPlay = false;
      final String urlSnapshot = currentUrl;
      main.post(() -> openFullscreenDialog(ctx, urlSnapshot));
    } else {
      wantsToPlay = false;
      closeDialogAndEmit(ctx);
    }
  }

  private void openFullscreenDialog(ThemedReactContext context, String url) {
    if (url == null || url.isEmpty()) return;

    final int token = ++playToken;
    closeDialogSilently();

    fullscreenDialog = new Dialog(context.getCurrentActivity(),
        android.R.style.Theme_Black_NoTitleBar_Fullscreen);

    FrameLayout root = new FrameLayout(context);
    root.setBackgroundColor(Color.BLACK);

    final VideoView videoView = new VideoView(context);
    final FrameLayout.LayoutParams videoLp = new FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
        Gravity.CENTER
    );
    videoView.setLayoutParams(videoLp);
    videoView.requestFocus();

    ProgressBar spinner = new ProgressBar(context);
    FrameLayout.LayoutParams spLp = new FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.WRAP_CONTENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
        Gravity.CENTER
    );
    spinner.setLayoutParams(spLp);
    spinner.setIndeterminate(true);
    spinner.setVisibility(View.VISIBLE);

    loadingSpinner = spinner;
    activeVideoView = videoView;

    DisplayMetrics dm = context.getResources().getDisplayMetrics();
    int screenH = dm.heightPixels;
    int backSize = (int) (0.08f * screenH);

    int statusBarResId = context.getResources().getIdentifier("status_bar_height", "dimen", "android");
    int statusBarHeight = statusBarResId > 0
        ? context.getResources().getDimensionPixelSize(statusBarResId)
        : 0;

    int extraTop = (int) (0.05f * screenH);
    int topMargin = statusBarHeight + extraTop;

    ImageView back = new ImageView(context);
    back.setImageResource(android.R.drawable.ic_menu_revert);
    FrameLayout.LayoutParams backLp = new FrameLayout.LayoutParams(
        backSize,
        backSize,
        Gravity.START | Gravity.TOP
    );
    backLp.topMargin = topMargin;
    backLp.leftMargin = (int) (16 * dm.density);
    back.setLayoutParams(backLp);
    back.setColorFilter(Color.WHITE);
    int touchPadding = (int) (16 * dm.density);
    back.setPadding(touchPadding, touchPadding, touchPadding, touchPadding);
    back.setOnClickListener(v -> {
      currentUrl = null;
      wantsToPlay = false;
      ++playToken;
      closeDialogSilently();
      emitClosed(context);
    });

    final MediaController controller = new MediaController(context);
    controller.setAnchorView(videoView);
    videoView.setMediaController(controller);


    videoView.setOnPreparedListener(mp -> {
      if (token != playToken) return;

      int videoW = mp.getVideoWidth();
      int videoH = mp.getVideoHeight();
      if (videoW > 0 && videoH > 0) {
        int screenW = dm.widthPixels;
        int targetH = Math.round(screenW * (videoH / (float) videoW));
        int maxH = dm.heightPixels;
        if (targetH > maxH) {
          targetH = maxH;
          int targetW = Math.round(maxH * (videoW / (float) videoH));
          videoLp.width = targetW;
        } else {
          videoLp.width = ViewGroup.LayoutParams.MATCH_PARENT;
        }
        videoLp.height = targetH;
        videoLp.gravity = Gravity.CENTER;
        videoView.setLayoutParams(videoLp);
        videoView.requestLayout();
      }

      mp.setOnInfoListener((m, what, extra) -> {
        if (token != playToken) return true;
        if (what == MediaPlayer.MEDIA_INFO_VIDEO_RENDERING_START) {
          if (loadingSpinner != null) loadingSpinner.setVisibility(View.GONE);
        }
        return false;
      });

      try {
        videoView.start();
        videoView.pause();
        videoView.seekTo(1);
      } catch (Throwable ignored) {}
      videoView.start();
    });

    videoView.setOnErrorListener((mp, what, extra) -> {
      if (token != playToken) return true;
      if (loadingSpinner != null) loadingSpinner.setVisibility(View.GONE);
      emitEvent(context, "VideoPlayerError", null);
      closeDialogSilently();
      emitClosed(context);
      return true;
    });

    videoView.setOnCompletionListener(mp -> {
      if (token != playToken) return;
      try {
        videoView.seekTo(0);
        videoView.pause();
      } catch (Throwable ignored) {}
      controller.show();
    });


    videoView.setVideoURI(Uri.parse(url));

    root.addView(videoView);
    root.addView(spinner);
    root.addView(back);
    fullscreenDialog.setContentView(root);
    fullscreenDialog.setOnDismissListener(d -> {
      if (token == playToken) {
        closeDialogSilently();
        emitClosed(context);
      }
    });
    fullscreenDialog.show();
  }


  private void closeDialogAndEmit(ThemedReactContext context) {
    ++playToken;
    closeDialogSilently();
    emitClosed(context);
  }

  private void closeDialogSilently() {
    if (activeVideoView != null) {
      try { activeVideoView.stopPlayback(); } catch (Throwable ignored) {}
      activeVideoView = null;
    }
    loadingSpinner = null;

    if (fullscreenDialog != null) {
      try { fullscreenDialog.dismiss(); } catch (Throwable ignored) {}
      fullscreenDialog = null;
    }
  }

  private void emitClosed(ThemedReactContext context) {
    emitEvent(context, "VideoPlayerClosed", null);
  }

  private void emitEvent(ThemedReactContext context, String name, @Nullable Object payload) {
    ReactContext rc = context.getReactApplicationContext();
    rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(name, payload);
  }
}
