import { boot } from "./shell/boot";
import { App } from "./shell/app";

const b = boot();
const app = new App(document.getElementById("app")!, b);
void app.start(new URLSearchParams(location.search));
(window as unknown as { app: App }).app = app;
