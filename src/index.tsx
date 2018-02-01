import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./pages/App";
import registerServiceWorker from "./registerServiceWorker";
import { Provider } from "mobx-react";
import "./globalStyles/prefixed-global.scss";
ReactDOM.render(<App />, document.getElementById("root") as HTMLElement);
registerServiceWorker();
