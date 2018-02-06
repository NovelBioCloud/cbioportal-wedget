import * as React from "react";
import * as ReactDOM from "react-dom";
import { updateConfig } from "./config/appConfig";
import { App } from "./pages/App";
import registerServiceWorker from "./registerServiceWorker";
import { Provider } from "mobx-react";
import "./globalStyles/prefixed-global.scss";
import { MockConfig } from "./shared/mock/MockConfig";
import * as $ from "jquery";
const start = () => {
	updateConfig();
	$(() => {
		const root = document.getElementById("reactRoot");
		ReactDOM.render(<App />, root);
	});
};
start();

registerServiceWorker();
