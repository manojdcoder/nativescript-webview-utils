# nativescript-webview-utils

Extends the NativeScript WebView for additional features

## Installation

```javascript
tns plugin add nativescript-webview-utils
```

## Usage

Import the plugin in app or main js file

```javascript
import "nativescript-webview-utils";
```

### Copy www folder

Once the plugin is installed, you need to copy the jquery file for WebView

```
cp -a node_modules/nativescript-webview-utils/www app/www
```

Replace `app` with `src` incase of Angular.

### Update webpack.config

Add `www` folder to

```javascript
            new CopyWebpackPlugin([
                { from: { glob: "www/**" } },
                { from: { glob: "fonts/**" } },
                { from: { glob: "**/*.jpg" } },
                { from: { glob: "**/*.png" } },
            ....
```

## Update minSdkVersion to 19 or higher

Android SDK 19 is required, update `App_Resources/Android/app.gradle`:

```
android {
  defaultConfig {
    minSdkVersion 19 // change this line
    generatedDensities = []
  }
  aaptOptions {
    additionalParameters "--no-version-vectors"
  }
}
```

## API

| Function                                  | Description                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| onPageReady(callback: (error?:any)=>void) | Callback function to be invoked when page is loaded and jQuery is added to page. |
| getHtml():Promise                         | Returns a promise with HTML string of current page loaded in WebView             |
| evaluateJavaScript(value:string):Promise  | Execute JavaScript as a string in the WebView context, returns the result if any |

## Events

| Event                                  | Description                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| windowOpen(event: WindowEventData)     | Fired on WebView when a new window is requested. Set `event.cancel` to `true` to prevent opening new WebView. |
| windowOpened(event: WindowedEventData) | Fired on WebView after opening new window, this is where you may customize the modal window.                  |
| windowClosed(event: EventData)         | Fired on WebView after closing the window.                                                                    |

**Note:** Unset the callback function (`onPageReady(null)`) before you close the active Page or when you are done with WebView to avoid memory leaks.

## License

Private
