import { getJQuery, Orientation } from "./webview-utils.common";
import { device } from "@nativescript/core/platform";
import { WebView } from "@nativescript/core/ui/web-view";
import { alert, confirm, prompt } from "@nativescript/core/ui/dialogs";

export * from "./webview-utils.common";

export class PluginWKNavigationDelegateImpl
  extends NSObject
  implements WKNavigationDelegate
{
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
    webView: WKWebView,
    navigationAction: WKNavigationAction,
    decisionHandler: any
  ) {
    decisionHandler(WKNavigationActionPolicy.Allow + 2);
  }

  webViewDidStartProvisionalNavigation(
    webView: WKWebView,
    navigation: WKNavigation
  ) {
    const owner = this._origDelegate._owner.get();
    if (owner) {
      owner._onLoadStarted(webView.URL.absoluteString, void 0);
    }
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
        owner._onZoomEnabledChanged(owner.zoomEnabled);
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

  webViewRunJavaScriptAlertPanelWithMessageInitiatedByFrameCompletionHandler(
    webView: WKWebView,
    message: string,
    frame: WKFrameInfo,
    completionHandler: () => void
  ): void {
    alert({ title: "", message: message || " ", okButtonText: "OK" })
      .catch((err) => console.log(err))
      .then(() => completionHandler());
  }

  webViewRunJavaScriptConfirmPanelWithMessageInitiatedByFrameCompletionHandler(
    webView: WKWebView,
    message: string,
    frame: WKFrameInfo,
    completionHandler: (p1: boolean) => void
  ): void {
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
      .then((result) => completionHandler(result));
  }

  webViewRunJavaScriptTextInputPanelWithPromptDefaultTextInitiatedByFrameCompletionHandler(
    webView: WKWebView,
    message: string,
    defaultText: string,
    frame: WKFrameInfo,
    completionHandler: (p1: string) => void
  ): void {
    prompt({
      title: "",
      message: message || " ",
      defaultText: defaultText,
      okButtonText: "OK",
      cancelButtonText: "Cancel",
    })
      .catch((err) => {
        console.log(err);
        return { result: false, text: "" };
      })
      .then((result) => completionHandler(result.text));
  }
}

function createNativeView(
  configuration: WKWebViewConfiguration = WKWebViewConfiguration.new()
) {
  const jScript =
    getJQuery() +
    "var meta = document.createElement('meta'); meta.setAttribute('name', 'viewport'); meta.setAttribute('content', 'initial-scale=1.0'); document.getElementsByTagName('head')[0].appendChild(meta);";
  const wkUScript =
    WKUserScript.alloc().initWithSourceInjectionTimeForMainFrameOnly(
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
  configuration.mediaPlaybackRequiresUserAction =
    this.mediaPlaybackRequiresGesture;

  return new WKWebView({
    frame: CGRectZero,
    configuration,
  });
}

WebView.prototype.createNativeView = function () {
  const nativeView = this.wkWebView || createNativeView.call(this);
  this.wkWebView = null;
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

WebView.prototype.disposeNativeView = function () {
  this._originalDelegate = null;
  this._uiDelegate = null;
  this.original_disposeNativeView();
};

WebView.prototype.onUnloaded = function () {
  this.ios.UIDelegate = null;
  this.original_onUnloaded();
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

WebView.prototype._onMediaPlaybackRequiresGestureChanged = function (
  value: boolean
) {
  // This property can not be updated, must be set at creation
};

WebView.prototype._onPreviewLinkChanged = function (value: boolean) {
  const nativeView: WKWebView = this.nativeViewProtected;
  nativeView.allowsLinkPreview = value;
};

WebView.prototype._onOrientationChanged = function (value: Orientation) {
  const webView: WebView = this;
  const viewController: UIViewController =
    webView.page && webView.page.viewController;

  if (viewController) {
    let value1 = UIInterfaceOrientationMask.All;
    let value2 =
      UIInterfaceOrientation.Portrait |
      UIInterfaceOrientation.PortraitUpsideDown |
      UIInterfaceOrientation.LandscapeLeft |
      UIInterfaceOrientation.LandscapeRight;

    if (value === Orientation.Portrait) {
      value1 = UIInterfaceOrientationMask.Portrait;
      value2 =
        UIInterfaceOrientation.Portrait |
        UIInterfaceOrientation.PortraitUpsideDown;
    } else if (value === Orientation.Landscape) {
      value1 = UIInterfaceOrientationMask.Landscape;
      value2 =
        UIInterfaceOrientation.LandscapeLeft |
        UIInterfaceOrientation.LandscapeRight;
    }

    updateOrientation(viewController, value1, value2);
  }
};

WebView.prototype._onOverScrollEnabledChanged = function (value: boolean) {
  const nativeView: WKWebView = this.nativeViewProtected;
  nativeView.scrollView.bounces = value;
};

WebView.prototype._onZoomEnabledChanged = function (value: boolean) {
  const content = value
    ? "width=device-width, initial-scale=1.0, user-scalable=yes"
    : "width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no";
  this.evaluateJavaScript(
    `document.querySelector("meta[name=viewport]")?.setAttribute("content", "${content}")`
  );
};

WebView.prototype._onCreateNativeWindow = function (
  newWebView: WebView,
  params: any
): WKWebView {
  const { configuration } = params;
  const wkWebView: WKWebView = createNativeView(configuration);
  newWebView.wkWebView = wkWebView;
  return wkWebView;
};

WebView.prototype._onCancelNativeWindow = function (params: any): WKWebView {
  return null;
};

function updateOrientation(
  viewController: UIViewController,
  value1: UIInterfaceOrientationMask,
  value2: UIInterfaceOrientation
) {
  let proto = viewController;
  do {
    proto = Object.getPrototypeOf(proto);
  } while (
    proto !== null &&
    !proto.hasOwnProperty("supportedInterfaceOrientations")
  );

  Object.defineProperty(proto, "supportedInterfaceOrientations", {
    get: function () {
      return value1;
    },
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(proto, "preferredInterfaceOrientationForPresentation", {
    get: function () {
      return value2;
    },
    enumerable: true,
    configurable: true,
  });

  if (
    parseInt(device.osVersion) >= 16 &&
    (viewController as any).setNeedsUpdateOfSupportedInterfaceOrientations
  ) {
    (viewController as any).setNeedsUpdateOfSupportedInterfaceOrientations();
  } else if ((viewController as any).attemptRotationToDeviceOrientation) {
    (viewController as any).attemptRotationToDeviceOrientation();
  }
}
