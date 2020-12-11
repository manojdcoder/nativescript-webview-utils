import { Observable } from "@nativescript/core/data/observable";
import { WebView, LoadEventData } from "@nativescript/core/ui/web-view";

export class WebViewControlsModel extends Observable {
    constructor(public webView: WebView) {
        super();
        webView.on(WebView.loadFinishedEvent, this.onLoaded, this);
    }

    onLoaded(args: LoadEventData) {
        this.set("url", args.url);
    }

    close() {
        this.webView.close();
    }
}
