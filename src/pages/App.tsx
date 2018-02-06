import ResultsViewPageCustom from "./resultsView/ResultsViewPageCustom";
import { Component } from "react";
import * as React from "react";
import { updateConfig } from "../config/appConfig";
import { ResultsViewPageStoreCustom } from "./resultsView/ResultsViewPageStoreCustom";
export class App extends Component<any, any> {
	constructor(props) {
		super(props);
	}
	render() {
		return (
			<div className={"cbioportal-frontend"}>
				<ResultsViewPageCustom />
			</div>
		);
	}
}
