package com.blablabla.app;

import android.app.PictureInPictureParams;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Rational;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Set PiP params early so auto-enter works on Android 12+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
                builder.setAspectRatio(new Rational(16, 9));
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    builder.setAutoEnterEnabled(true);
                    builder.setSeamlessResizeEnabled(true);
                }
                setPictureInPictureParams(builder.build());
            } catch (Exception e) {
                // PiP not supported
            }
        }
    }

    @Override
    public void onUserLeaveHint() {
        super.onUserLeaveHint();
        // Always enter PiP when user presses Home (this is a music app)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
                builder.setAspectRatio(new Rational(16, 9));
                enterPictureInPictureMode(builder.build());
            } catch (Exception e) {
                // PiP not supported on this device
            }
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPiPMode, Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPiPMode, newConfig);

        try {
            WebView wv = getBridge().getWebView();
            if (wv != null) {
                // Tell the web app about PiP state
                wv.evaluateJavascript(
                    "if(typeof onPiPChanged==='function') onPiPChanged(" + isInPiPMode + ");",
                    null
                );

                if (isInPiPMode) {
                    // Keep WebView active in PiP
                    wv.onResume();
                    wv.resumeTimers();
                }
            }
        } catch (Exception e) {
            // ignore
        }
    }

    @Override
    public void onPause() {
        super.onPause();

        // Keep WebView alive when in PiP mode
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isInPictureInPictureMode()) {
            handler.postDelayed(() -> {
                try {
                    WebView wv = getBridge().getWebView();
                    if (wv != null) {
                        wv.onResume();
                        wv.resumeTimers();
                    }
                } catch (Exception e) {
                    // ignore
                }
            }, 200);
        }
    }
}
