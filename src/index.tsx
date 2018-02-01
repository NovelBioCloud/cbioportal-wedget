import * as React from "react";
import * as ReactDOM from "react-dom";
import { App, init } from "./pages/App";
import registerServiceWorker from "./registerServiceWorker";
import { Provider } from "mobx-react";
import "./globalStyles/prefixed-global.scss";
init(() => {
	ReactDOM.render(<App />, document.getElementById("root") as HTMLElement);
});
registerServiceWorker();
