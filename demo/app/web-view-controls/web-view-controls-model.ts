import { Observable } from "@nativescript/core/data/observable";
import { WebView, LoadEventData } from "@nativescript/core/ui/web-view";

export class WebViewControlsModel extends Observable {
    constructor(public webView: WebView) {
        super();
        webView.on(WebView.loadStartedEvent, this.onLoadEvent, this);
        webView.on(WebView.loadFinishedEvent, this.onLoadEvent, this);
    }

    onLoadEvent(args: LoadEventData) {
        console.log(args.eventName + " = " + args.url);
    }

    close() {
        this.webView.close();
    }
}
