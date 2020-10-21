import "./webview-utils.common";
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
                owner.injectQuery();
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

WebView.prototype.createNativeView = function () {
    const jScript =
        this.getJQuery() +
        "var meta = document.createElement('meta'); meta.setAttribute('name', 'viewport'); meta.setAttribute('content', 'initial-scale=1.0'); document.getElementsByTagName('head')[0].appendChild(meta);";
    const wkUScript = WKUserScript.alloc().initWithSourceInjectionTimeForMainFrameOnly(
        jScript,
        WKUserScriptInjectionTime.AtDocumentEnd,
        true
    );
    const wkUController = WKUserContentController.new();
    wkUController.addUserScript(wkUScript);

    const configuration = WKWebViewConfiguration.new();
    configuration.userContentController = wkUController;
    configuration.preferences.setValueForKey(
        true,
        "allowFileAccessFromFileURLs"
    );

    return new WKWebView({
        frame: CGRectZero,
        configuration: configuration,
    });
};

WebView.prototype.pluginInitNativeView = function () {
    this._originalDelegate = this._delegate;
    this._delegate = PluginWKNavigationDelegateImpl.initWithOriginalDelegate(
        this._originalDelegate
    );
    this.ios.navigationDelegate = this._delegate;
};

WebView.prototype.evaluateJavaScript = function (value: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const nativeView = this.nativeViewProtected as WKWebView;
        nativeView.evaluateJavaScriptCompletionHandler(value, (result, err) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};
