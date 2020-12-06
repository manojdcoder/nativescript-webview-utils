import { isAndroid } from "@nativescript/core/platform";
import { Color } from "@nativescript/core/color";
import { View } from "@nativescript/core/ui/core/view";
import {
  GridLayout,
  ItemSpec,
} from "@nativescript/core/ui/layouts/grid-layout";
import { Button } from "@nativescript/core/ui/button";
import { WebView } from "@nativescript/core/ui/web-view";
import { knownFolders } from "@nativescript/core/file-system";

export interface WindowEventData {
  eventName: string;
  object: WebView;
  cancel: boolean;
  params: any;
}

export const openWindowEvent = "openWindow";
export const closeWindowEvent = "closeWindow";

export function getJQuery() {
  return knownFolders
    .currentApp()
    .getFolder("www")
    .getFile("jquery.js")
    .readTextSync();
}

(WebView as any).openWindowEvent = openWindowEvent;
(WebView as any).closeWindowEvent = closeWindowEvent;

WebView.prototype.jsGetHtml = "document.documentElement.outerHTML.toString()";

WebView.prototype.original_createNativeView =
  WebView.prototype.createNativeView;
WebView.prototype.original_initNativeView = WebView.prototype.initNativeView;

WebView.prototype.injectjQuery = async function () {
  try {
    await this.evaluateJavaScript(getJQuery());
    this.pageReadyCallback && this.pageReadyCallback();
  } catch (error) {
    this.pageReadyCallback && this.pageReadyCallback(error);
  }
};

WebView.prototype.onPageReady = function (callback: (error?: any) => void) {
  this.pageReadyCallback = callback;
};

WebView.prototype.getHtml = function (): Promise<string> {
  return this.evaluateJavaScript(this.jsGetHtml);
};

WebView.prototype._onCreateWindow = function (
  params: any
): boolean | WKWebView {
  const args: WindowEventData = {
    eventName: openWindowEvent,
    object: this,
    cancel: false,
    params,
  };
  this.notify(args);

  if (args.cancel) {
    return this._onCancelNativeWindow();
  }

  const modalView = new GridLayout();
  modalView.backgroundColor = new Color("#000");
  modalView.addRow(new ItemSpec(1, "auto"));
  modalView.addRow(new ItemSpec(1, "star"));
  modalView.addColumn(new ItemSpec(1, "star"));

  const closeButton = new Button();
  closeButton.marginTop = isAndroid ? 40 : 0;
  closeButton.backgroundColor = new Color("transparent");
  closeButton.borderColor = new Color("transparent");
  closeButton.color = new Color("#fff");
  closeButton.text = "Close";
  closeButton.once(Button.tapEvent, () => modalView.closeModal());
  modalView.addChildAtCell(closeButton, 0, 0);

  const newWebView = new WebView();
  modalView.addChildAtCell(newWebView, 1, 0);

  this.showModal(modalView, {
    context: {},
    closeCallback: () => {},
    fullscreen: true,
    cancelable: false,
  });

  return this._onCreateNativeWindow(newWebView, params);
};

WebView.prototype._onCloseWindow = function (params: any) {
  const args: WindowEventData = {
    eventName: closeWindowEvent,
    object: this,
    cancel: false,
    params,
  };
  this.notify(args);

  if (args.cancel) {
    return false;
  }

  const parent: View = this.parent;
  parent.closeModal();

  return true;
};
