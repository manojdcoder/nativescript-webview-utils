import { isAndroid, isIOS } from "@nativescript/core/platform";
import { EventData } from "@nativescript/core/data/observable";
import { Color } from "@nativescript/core/color";
import { Property } from "@nativescript/core/ui/core/properties";
import { booleanConverter } from "@nativescript/core/ui/core/view-base";
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

export interface WindowedEventData {
  eventName: string;
  object: WebView;
  modalView: GridLayout;
  webView: WebView;
}

export const windowOpenEvent = "windowOpen";
export const windowOpenedEvent = "windowOpened";
export const windowClosedEvent = "windowClosed";

export const config = {
  wwwFolder: "www",
};

export function getJQuery() {
  return knownFolders
    .currentApp()
    .getFolder(config.wwwFolder)
    .getFile("jquery.js")
    .readTextSync();
}

(WebView as any).windowOpenEvent = windowOpenEvent;
(WebView as any).windowOpenedEvent = windowOpenedEvent;
(WebView as any).windowClosedEvent = windowClosedEvent;

export const mediaPlaybackRequiresGestureProperty = new Property<WebView, boolean>({
  name: "mediaPlaybackRequiresGesture",
  valueConverter: booleanConverter,
});

WebView.prototype[mediaPlaybackRequiresGestureProperty.getDefault] = function () {
  return true;
};

WebView.prototype[mediaPlaybackRequiresGestureProperty.setNative] = function (value: boolean) {
  this._onMediaPlaybackRequiresGestureChanged(value);
};

mediaPlaybackRequiresGestureProperty.register(WebView);

export const previewLinkProperty = new Property<WebView, boolean>({
  name: "previewLink",
  valueConverter: booleanConverter,
});

WebView.prototype[previewLinkProperty.getDefault] = function () {
  return true;
};

WebView.prototype[previewLinkProperty.setNative] = function (value: boolean) {
  if (isIOS) {
    this._onPreviewLinkChanged(value);
  }
};

previewLinkProperty.register(WebView);

export const overScrollEnabledProperty = new Property<WebView, boolean>({
  name: "overScrollEnabled",
  valueConverter: booleanConverter,
});

WebView.prototype[overScrollEnabledProperty.getDefault] = function () {
  return true;
};

WebView.prototype[overScrollEnabledProperty.setNative] = function (
  value: boolean
) {
  this._onOverScrollEnabledChanged(value);
};

overScrollEnabledProperty.register(WebView);

export const zoomEnabledProperty = new Property<WebView, boolean>({
  name: "zoomEnabled",
  valueConverter: booleanConverter,
});

WebView.prototype[zoomEnabledProperty.getDefault] = function () {
  return true;
};

WebView.prototype[zoomEnabledProperty.setNative] = function (value: boolean) {
  this._onZoomEnabledChanged(value);
};

zoomEnabledProperty.register(WebView);

WebView.prototype.jsGetHtml = "document.documentElement.outerHTML.toString()";
WebView.prototype.jsClose = `
  (() => { 
    window.close(); 
    return window.closed;
  })();
`;

WebView.prototype.original_createNativeView =
  WebView.prototype.createNativeView;
WebView.prototype.original_initNativeView = WebView.prototype.initNativeView;
WebView.prototype.original_disposeNativeView =
  WebView.prototype.disposeNativeView;
WebView.prototype.original_onUnloaded = WebView.prototype.onUnloaded;

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

WebView.prototype.close = function (): Promise<void> {
  return this.evaluateJavaScript(this.jsClose).then(() =>
    this._onCloseWindow()
  );
};

WebView.prototype._onCreateWindow = function (
  params: any
): boolean | WKWebView {
  const args: WindowEventData = {
    eventName: windowOpenEvent,
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

  const newWebView = new WebView();
  newWebView.modalView = modalView;
  const returnValue = this._onCreateNativeWindow(newWebView, params);
  modalView.addChildAtCell(newWebView, 1, 0);

  const closeButton = new Button();
  closeButton.id = "btnClose";
  closeButton.marginTop = isAndroid ? 40 : 0;
  closeButton.backgroundColor = new Color("transparent");
  closeButton.borderColor = new Color("transparent");
  closeButton.color = new Color("#fff");
  closeButton.text = "Close";
  closeButton.once(Button.tapEvent, () => newWebView.close());
  modalView.addChildAtCell(closeButton, 0, 0);

  modalView.once(View.shownModallyEvent, () => {
    const args: WindowedEventData = {
      eventName: windowOpenedEvent,
      object: this,
      modalView,
      webView: newWebView,
    };
    this.notify(args);
  });

  this.showModal(modalView, {
    context: {},
    closeCallback: () => {},
    fullscreen: true,
    cancelable: false,
  });

  return returnValue;
};

WebView.prototype._onCloseWindow = function (params?: any) {
  const modalView: GridLayout = this.modalView;

  if (modalView) {
    this.modalView = null;
    modalView.closeModal();

    const args: EventData = {
      eventName: windowClosedEvent,
      object: this,
    };
    this.notify(args);
  }

  return true;
};
