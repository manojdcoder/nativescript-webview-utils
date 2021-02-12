import { EventData } from "@nativescript/core/data/observable";
import { View } from "@nativescript/core/ui/core/view";
import { Builder } from "@nativescript/core/ui/builder";
import { NavigatedData, Page } from "@nativescript/core/ui/page";
import { WebView, LoadEventData } from "@nativescript/core/ui/web-view";
import { WindowEventData, WindowedEventData } from "nativescript-webview-utils";

import { WebViewControlsModel } from "../web-view-controls/web-view-controls-model";
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

export function onLoadEvent(args: LoadEventData) {
    console.log(args.eventName + " = " + args.url);
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

export function onWindowOpen(args: WindowEventData) {
    console.log("Opening window...");
}

export function onWindowOpened(args: WindowedEventData) {
    console.log("Opened window...");
    const { webView, modalView } = args;
    webView.previewLink = false;

    webView.on("loadStarted", onLoadEvent);
    webView.on("loadFinished", onLoadEvent);

    // Modify modal view
    modalView.removeChild(modalView.getViewById("btnClose"));
    const bindingContext = new WebViewControlsModel(webView);
    const view = Builder.load({
        path: "~/web-view-controls",
        name: "web-view-controls",
        attributes: {
            bindingContext,
        },
    });
    modalView.addChildAtCell(view, 0, 1);
}

export function onWindowClosed(args: WindowEventData) {
    console.log("Closed window...");
}
