declare module "@nativescript/core/ui/web-view" {
    interface WebView {
        private jsGetHtml: string;
        private pageReadyCallback: (err?: any) => void;
        private getJQuery: () => string;
        private originalInitNativeView();
        private pluginInitNativeView();
        private _onLoadFinished(url: string, error?: string);
        private original_onLoadFinished(url: string, error?: string);
        private injectQuery();
        onPageReady(callback: (err?: any) => void);
        evaluateJavaScript(value: string): Promise<any>;
        getHtml(): Promise<string>;
    }
}

export * from "./webview-utils.common";
