import { Observable } from "@nativescript/core/data/observable";
import { Orientation } from "nativescript-webview-utils";

export class HomeViewModel extends Observable {
    constructor() {
        super();
        this.set("mediaPlaybackRequiresGesture", false);
        this.set("orientation", Orientation.Portrait);
        this.set("overScrollEnabled", false);
        this.set("zoomEnabled", false);
        this.set(
            "html",
            `
                <style type="text/css">
                    a {
                        display: block;
                        margin-bottom: 2rem;
                    }
                </style>
                <script>
                    function doAlert() {
                        alert("Hello World");
                    }

                    function doConfirm() {
                        alert(confirm("Are you sure?"));
                    }

                    function doPrompt() {
                        alert(prompt("Enter something?"));
                    }
                </script>
                <a href="https://www.amazon.ca/">Amazon</a>
                <a href="https://www.footasylum.com/">Foot Asylum</a>
                <a href="http://www.tomcruise.com/">Tomcruise</a>
                <button onclick="doAlert()">Alert</button>
                <button onclick="doConfirm()">Confirm</button>
                <button onclick="doPrompt()">Prompt</button>
            `
        );
    }
}
