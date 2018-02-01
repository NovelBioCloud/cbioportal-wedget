import Mutations from "./resultsView/mutation/Mutations";
import ResultsViewPage from "./resultsView/ResultsViewPage";
import { Component } from "react";
import * as React from "react";
import { updateConfig } from "../config/appConfig";
export const init = callback => {
	updateConfig();
	callback();
};
export class App extends Component<any, any> {
	render() {
		return <ResultsViewPage />;
	}
}
