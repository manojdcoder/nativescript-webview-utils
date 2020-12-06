import { getJQuery } from "./webview-utils.common";
import { View } from "@nativescript/core/ui/core/view";
import { WebView } from "@nativescript/core/ui/web-view";

export class PluginWKNavigationDelegateImpl
  extends NSObject
  implements WKNavigationDelegate {
  public static ObjCProtocols = [WKNavigationDelegate];

  private _origDelegate: any;

  public static initWithOriginalDelegate(
    origDelegate: any
  ): PluginWKNavigationDelegateImpl {
    let delegate = new PluginWKNavigationDelegateImpl();
    delegate._origDelegate = origDelegate;
    return delegate;
  }

  webViewDecidePolicyForNavigationActionDecisionHandler(
    webView,
    navigationAction,
    decisionHandler
  ) {
    this._origDelegate.webViewDecidePolicyForNavigationActionDecisionHandler(
      webView,
      navigationAction,
      () => {
        decisionHandler(WKNavigationActionPolicy.Allow + 2);
      }
    );
  }

  webViewDidStartProvisionalNavigation(
    webView: WKWebView,
    navigation: WKNavigation
  ) {
    this._origDelegate.webViewDidStartProvisionalNavigation(
      webView,
      navigation
    );
  }

  webViewDidFinishNavigation(webView: WKWebView, navigation: WKNavigation) {
    this._origDelegate.webViewDidFinishNavigation(webView, navigation);
    if (!webView.loading) {
      const owner = this._origDelegate._owner.get();
      if (owner) {
        owner.injectjQuery();
      }
    }
  }

  webViewDidFailNavigationWithError(
    webView: WKWebView,
    navigation: WKNavigation,
    error: NSError
  ) {
    this._origDelegate.webViewDidFailNavigationWithError(
      webView,
      navigation,
      error
    );
  }

  webViewDidFailProvisionalNavigationWithError(
    webView: WKWebView,
    navigation: WKNavigation,
    error: NSError
  ) {
    this._origDelegate.webViewDidFailProvisionalNavigationWithError(
      webView,
      navigation,
      error
    );
  }
}

export class PluginWKUIDelegateImpl extends NSObject implements WKUIDelegate {
  public static ObjCProtocols = [WKUIDelegate];

  private _owner: WeakRef<WebView>;

  public static initWithOwner(owner: WeakRef<WebView>): PluginWKUIDelegateImpl {
    const handler = <PluginWKUIDelegateImpl>PluginWKUIDelegateImpl.new();
    handler._owner = owner;
    return handler;
  }

  webViewCreateWebViewWithConfigurationForNavigationActionWindowFeatures(
    webView: WKWebView,
    configuration: WKWebViewConfiguration,
    navigationAction: WKNavigationAction,
    windowFeatures: WKWindowFeatures
  ): WKWebView {
    const owner = this._owner.get();
    if (owner) {
      return owner._onCreateWindow({
        webView,
        configuration,
        navigationAction,
        windowFeatures,
      }) as WKWebView;
    }
    return null;
  }

  webViewDidClose(webView: WKWebView) {
    const owner = this._owner.get();
    if (owner) {
      owner._onCloseWindow({ webView });
    }
  }
}

function createNativeView(
  configuration: WKWebViewConfiguration = WKWebViewConfiguration.new()
) {
  const jScript =
    getJQuery() +
    "var meta = document.createElement('meta'); meta.setAttribute('name', 'viewport'); meta.setAttribute('content', 'initial-scale=1.0'); document.getElementsByTagName('head')[0].appendChild(meta);";
  const wkUScript = WKUserScript.alloc().initWithSourceInjectionTimeForMainFrameOnly(
    jScript,
    WKUserScriptInjectionTime.AtDocumentEnd,
    true
  );

  if (!configuration.userContentController) {
    const wkUController = WKUserContentController.new();
    configuration.userContentController = wkUController;
  }
  configuration.userContentController.addUserScript(wkUScript);

  configuration.preferences.setValueForKey(true, "allowFileAccessFromFileURLs");

  return new WKWebView({
    frame: CGRectZero,
    configuration,
  });
}

WebView.prototype.createNativeView = function () {
  const nativeView = this.newWebView || createNativeView();
  this.newWebView = null;
  return nativeView;
};

WebView.prototype.initNativeView = function () {
  this.original_initNativeView();
  this._originalDelegate = this._delegate;
  this._delegate = PluginWKNavigationDelegateImpl.initWithOriginalDelegate(
    this._originalDelegate
  );
  this._uiDelegate = PluginWKUIDelegateImpl.initWithOwner(new WeakRef(this));
  this.ios.navigationDelegate = this._delegate;
  this.ios.UIDelegate = this._uiDelegate;
};

WebView.prototype.evaluateJavaScript = function (value: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const nativeView: WKWebView = this.nativeViewProtected;
    nativeView.evaluateJavaScriptCompletionHandler(value, (result, error) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

WebView.prototype._onCreateNativeWindow = function (
  newWebView: WebView,
  params: any
): WKWebView {
  const { configuration, navigationAction } = params;
  const wkWebView: WKWebView = createNativeView(configuration);
  newWebView.once(View.loadedEvent, () => {
    const nativeView = newWebView.nativeViewProtected;
    nativeView.loadRequest(navigationAction.request);
  });
  newWebView.wkWebView = wkWebView;
  return wkWebView;
};

WebView.prototype._onCancelNativeWindow = function (params: any): WKWebView {
  return null;
};
