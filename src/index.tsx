import * as React from "react";
import * as ReactDOM from "react-dom";
import { updateConfig } from "./config/appConfig";
import { App } from "./pages/App";
import registerServiceWorker from "./registerServiceWorker";
import { Provider } from "mobx-react";
import "./globalStyles/prefixed-global.scss";
import { MockConfig } from "./shared/mock/MockConfig";

const start = () => {
	updateConfig();
	$(() => {
		ReactDOM.render(<App />, document.getElementById("root") as HTMLElement);
	});
};
start();

registerServiceWorker();
