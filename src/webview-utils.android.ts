import "./webview-utils.common";
import { WebView } from "@nativescript/core/ui/web-view";

WebView.prototype.pluginInitNativeView = function () {};

WebView.prototype.original_onLoadFinished = WebView.prototype._onLoadFinished;
WebView.prototype._onLoadFinished = function (url: string, error?: string) {
    this.original_onLoadFinished(url, error);
    this.injectQuery();
};

WebView.prototype.evaluateJavaScript = function (value: string): Promise<any> {
    const nativeView = this.nativeViewProtected as android.webkit.WebView;
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
