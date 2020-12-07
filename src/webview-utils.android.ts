import { View } from "@nativescript/core/ui/core/view";
import { WebView } from "@nativescript/core/ui/web-view";

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
            result = (org.apache as any).commons.text.StringEscapeUtils.unescapeJava(
              result
            );
          }
          resolve(result);
        },
      })
    );
  });
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
