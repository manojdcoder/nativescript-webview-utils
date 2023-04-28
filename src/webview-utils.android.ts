import { android as application } from "@nativescript/core/application";
import { View } from "@nativescript/core/ui/core/view";
import { WebView } from "@nativescript/core/ui/web-view";
import { alert, confirm, prompt } from "@nativescript/core/ui/dialogs";
import { Orientation } from "./webview-utils.common";

export * from "./webview-utils.common";

let WebChromeClient;

function initializeWebChromeClient(): void {
  if (WebChromeClient) {
    return;
  }

  WebChromeClient = (android.webkit.WebChromeClient as any).extend({
    onCreateWindow: function (
      view: android.webkit.WebView,
      isDialog: boolean,
      isUserGesture: boolean,
      resultMsg: android.os.Message
    ) {
      const owner = this.owner;
      if (owner) {
        return owner._onCreateWindow({
          view,
          isDialog,
          isUserGesture,
          resultMsg,
        });
      }
      return false;
    },
    onJsAlert: function (
      view: android.webkit.WebView,
      url: string,
      message: string,
      jsResult: android.webkit.JsResult
    ): boolean {
      alert({ title: "", message: message || " ", okButtonText: "OK" })
        .catch((err) => console.log(err))
        .then(() => jsResult.confirm());

      return true;
    },
    onJsConfirm: function (
      view: android.webkit.WebView,
      url: string,
      message: string,
      jsResult: android.webkit.JsResult
    ): boolean {
      confirm({
        title: "",
        message: message || " ",
        okButtonText: "OK",
        cancelButtonText: "Cancel",
      })
        .catch((err) => {
          console.log(err);
          return false;
        })
        .then((result) => (result ? jsResult.confirm() : jsResult.cancel()));

      return true;
    },
    onJsPrompt: function (
      view: android.webkit.WebView,
      url: string,
      message: string,
      defaultValue: string,
      jsResult: android.webkit.JsPromptResult
    ): boolean {
      prompt({
        title: "",
        message: message || " ",
        defaultText: defaultValue,
        okButtonText: "OK",
        cancelButtonText: "Cancel",
      })
        .catch((err) => {
          console.log(err);
          return { result: false, text: "" };
        })
        .then((result) =>
          result.result ? jsResult.confirm(result.text) : jsResult.cancel()
        );

      return true;
    },
    onCloseWindow: function (view: android.webkit.WebView) {
      const owner = this.owner;
      if (owner) {
        return owner._onCloseWindow({ view });
      }
      return false;
    },
  });
}

WebView.prototype.createNativeView = function () {
  const nativeView: android.webkit.WebView = this.original_createNativeView();
  nativeView.getSettings().setSupportMultipleWindows(true);
  nativeView.getSettings().setDisplayZoomControls(this.isZoomEnabled);
  return nativeView;
};

WebView.prototype.initNativeView = function () {
  this.original_initNativeView();
  initializeWebChromeClient();
  const nativeView: android.webkit.WebView = this.nativeViewProtected;
  const chromeClient = new WebChromeClient();
  chromeClient.owner = this;
  nativeView.setWebChromeClient(chromeClient);
  (<any>nativeView).chromeClient = chromeClient;
};

WebView.prototype.original_onLoadFinished = WebView.prototype._onLoadFinished;
WebView.prototype._onLoadFinished = function (url: string, error?: string) {
  this.original_onLoadFinished(url, error);
  this._onZoomEnabledChanged(this.isZoomEnabled);
  this.injectjQuery();
};

WebView.prototype.evaluateJavaScript = function (value: string): Promise<any> {
  const nativeView: android.webkit.WebView = this.nativeViewProtected;
  return new Promise((resolve, reject) => {
    nativeView.evaluateJavascript(
      value,
      new android.webkit.ValueCallback({
        onReceiveValue(result) {
          if (typeof result === "string") {
            if (result.startsWith(`"`)) {
              result = result.substring(1, result.length - 1);
            }
            result = (
              org.apache as any
            ).commons.text.StringEscapeUtils.unescapeJava(result);
          }
          resolve(result);
        },
      })
    );
  });
};

WebView.prototype._onMediaPlaybackRequiresGestureChanged = function (
  value: boolean
) {
  const nativeView: android.webkit.WebView = this.nativeViewProtected;
  nativeView.getSettings().setMediaPlaybackRequiresUserGesture(value);
};

WebView.prototype._onOrientationChanged = function (value: Orientation) {
  const activity: androidx.appcompat.app.AppCompatActivity =
    application.foregroundActivity;

  let orientation =
    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_FULL_USER;
  if (value === Orientation.Portrait) {
    orientation =
      android.content.pm.ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT;
  } else if (value === Orientation.Landscape) {
    orientation =
      android.content.pm.ActivityInfo.SCREEN_ORIENTATION_USER_LANDSCAPE;
  }

  activity.setRequestedOrientation(orientation);
};

WebView.prototype._onOverScrollEnabledChanged = function (value: boolean) {
  const nativeView: android.webkit.WebView = this.nativeViewProtected;
  nativeView.setOverScrollMode(
    value
      ? android.view.View.OVER_SCROLL_IF_CONTENT_SCROLLS
      : android.view.View.OVER_SCROLL_NEVER
  );
};

WebView.prototype._onZoomEnabledChanged = function (value: boolean) {
  const nativeView: android.webkit.WebView = this.nativeViewProtected;
  nativeView.getSettings().setSupportZoom(value);
  nativeView.getSettings().setBuiltInZoomControls(value);
};

WebView.prototype._onCreateNativeWindow = function (
  newWebView: WebView,
  params: any
): boolean {
  newWebView.once(View.loadedEvent, () => {
    const nativeView = newWebView.nativeViewProtected;
    const { resultMsg } = params;
    resultMsg.obj.setWebView(nativeView);
    resultMsg.sendToTarget();
  });
  return true;
};

WebView.prototype._onCancelNativeWindow = function (params: any): boolean {
  return false;
};
