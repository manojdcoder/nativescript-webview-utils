import { WebView } from "@nativescript/core/ui/web-view";
import { knownFolders } from "@nativescript/core/file-system";

WebView.prototype.jsGetHtml = "document.documentElement.outerHTML.toString()";

WebView.prototype.getJQuery = function () {
    return knownFolders
        .currentApp()
        .getFolder("www")
        .getFile("jquery.js")
        .readTextSync();
};

WebView.prototype.originalInitNativeView = WebView.prototype.initNativeView;

WebView.prototype.injectQuery = async function () {
    try {
        await this.evaluateJavaScript(this.getJQuery());
        this.pageReadyCallback && this.pageReadyCallback();
    } catch (err) {
        this.pageReadyCallback && this.pageReadyCallback(err);
    }
};

WebView.prototype.onPageReady = function (callback: (err?: any) => void) {
    this.pageReadyCallback = callback;
};

WebView.prototype.initNativeView = function () {
    this.originalInitNativeView();
    this.pluginInitNativeView();
};

WebView.prototype.getHtml = function (): Promise<string> {
    return this.evaluateJavaScript(this.jsGetHtml);
};
