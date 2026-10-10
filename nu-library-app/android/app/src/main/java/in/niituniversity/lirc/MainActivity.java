package in.niituniversity.lirc;

import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.os.Build;

import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    if (getBridge() != null && getBridge().getWebView() != null) {
      String userAgent = getBridge().getWebView().getSettings().getUserAgentString();
      if (!userAgent.contains("NU-LIRC-Android")) {
        getBridge().getWebView().getSettings().setUserAgentString(userAgent + " NU-LIRC-Android/1.0");
      }
    }
    configureSystemBars();
  }

  private void configureSystemBars() {
    Window window = getWindow();
    WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, window.getDecorView());
    controller.setAppearanceLightStatusBars(false);
    controller.setAppearanceLightNavigationBars(false);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS | WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
      window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
    }
  }
}
