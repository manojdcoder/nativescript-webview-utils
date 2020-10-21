import { EventData } from "@nativescript/core/data/observable";
import { View } from "@nativescript/core/ui/core/view";
import { NavigatedData, Page } from "@nativescript/core/ui/page";
import { WebView, LoadEventData } from "@nativescript/core/ui/web-view";

import { HomeViewModel } from "./home-view-model";

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new HomeViewModel();

    const webView = page.getViewById("webView") as WebView;
    webView.onPageReady((error) => {
        if (error) {
            console.log(error);
        } else {
            console.log("Page ready....");
        }
    });
}

export function onLoadFinished(args: LoadEventData) {
    console.log(args.eventName);
}

export function onjQueryButtonClick(args: EventData) {
    const webView = (args.object as View).page.getViewById(
        "webView"
    ) as WebView;

    const js = `(function() {
            var el = $_NSapp_jQ(".nav-sprite.nav-logo-base");
            $_NSapp_jQ(el).remove();
            return $_NSapp_jQ(".nav-logo-link").attr("href");
        })()`;

    webView
        .evaluateJavaScript(js)
        .then((output) => {
            console.log(output);
        })
        .catch((err) => {
            alert(err);
        });
}

export function onGetHtmlButtonClick(args: EventData) {
    const webView = (args.object as View).page.getViewById(
        "webView"
    ) as WebView;

    webView
        .getHtml()
        .then((html) => {
            console.log(html);
        })
        .catch((err) => {
            alert(err);
        });
}
