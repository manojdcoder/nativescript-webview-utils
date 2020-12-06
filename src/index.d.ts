declare module "@nativescript/core/ui/web-view" {
  interface WebView {
    private jsGetHtml: string;
    private wkWebView: any;
    private pageReadyCallback: (error?: any) => void;
    private original_createNativeView();
    private original_initNativeView();
    private _onLoadFinished(url: string, error?: string);
    private original_onLoadFinished(url: string, error?: string);
    private injectjQuery();
    private _onCreateWindow(params: any): any;
    private _onCreateNativeWindow(newWebView: WebView, params: any): any;
    private _onCancelNativeWindow(params: any): any;
    private _onCloseWindow(params: any): boolean;
    onPageReady(callback: (error?: any) => void);
    evaluateJavaScript(value: string): Promise<any>;
    getHtml(): Promise<string>;
  }
}

export * from "./webview-utils.common";
