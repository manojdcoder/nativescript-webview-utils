import { Observable } from "@nativescript/core/data/observable";

export class HomeViewModel extends Observable {
    constructor() {
        super();
        this.set("html", "<a href='https://www.amazon.ca'>Amazon</a>");
    }
}
