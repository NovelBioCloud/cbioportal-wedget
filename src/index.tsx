import * as React from "react";
import * as ReactDOM from "react-dom";
import { App, Store } from "./App";
import registerServiceWorker from "./registerServiceWorker";
import "./index.css";
import { Provider } from "mobx-react";

ReactDOM.render(<App store={new Store()} />, document.getElementById("root") as HTMLElement);
registerServiceWorker();
