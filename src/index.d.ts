declare module "@nativescript/core/ui/web-view" {
  interface WebView {
    private jsGetHtml: string;
    private jsClose: string;
    private modalView: any;
    private wkWebView: any;
    private pageReadyCallback: (error?: any) => void;
    private original_createNativeView();
    private original_initNativeView();
    private original_disposeNativeView();
    private original_onUnloaded();
    private _onLoadFinished(url: string, error?: string);
    private original_onLoadFinished(url: string, error?: string);
    private injectjQuery();
    private _onPreviewLinkChanged(value: boolean);
    private _onCreateWindow(params: any): any;
    private _onCreateNativeWindow(newWebView: WebView, params: any): any;
    private _onCancelNativeWindow(params: any): any;
    private _onCloseWindow(params?: any): boolean;
    previewLink: boolean;
    onPageReady(callback: (error?: any) => void);
    evaluateJavaScript(value: string): Promise<any>;
    getHtml(): Promise<string>;
    close(): Promise<any>;
  }
}

export * from "./webview-utils.common";
