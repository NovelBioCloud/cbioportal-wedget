import * as React from "react";
import * as ReactDOM from "react-dom";
import { App, Store } from "./pages/App";
import registerServiceWorker from "./registerServiceWorker";
import { Provider } from "mobx-react";

ReactDOM.render(<App store={new Store()} />, document.getElementById("root") as HTMLElement);
registerServiceWorker();
