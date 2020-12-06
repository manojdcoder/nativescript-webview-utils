import { EventData } from "@nativescript/core/data/observable";
import { View } from "@nativescript/core/ui/core/view";
import { NavigatedData, Page } from "@nativescript/core/ui/page";
import { WebView, LoadEventData } from "@nativescript/core/ui/web-view";
import { WindowEventData } from "nativescript-webview-utils";

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
        .catch((error) => {
            alert(error);
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
        .catch((error) => {
            alert(error);
        });
}

export function onWindowButtonClick(args: EventData) {
    const page = <Page>args.object;
    page.bindingContext.set(
        "html",
        `<script>
            function onButtonClick() {
                window.open("https://www.footasylum.com");
            }
        </script>
        <button onclick="onButtonClick()">
            Open Window
        </button>`
    );
}

export function onOpenWindow(args: WindowEventData) {
    console.log("Opening window...");
}

export function onCloseWindow(args: WindowEventData) {
    console.log("Closing window...");
}
