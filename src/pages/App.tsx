import ResultsViewPageCustom from "./resultsView/ResultsViewPageCustom";
import { Component } from "react";
import * as React from "react";
import { updateConfig } from "../config/appConfig";
export class App extends Component<any, any> {
	constructor(props) {
		super(props);
	}
	render() {
		return (
			// cbioportal-frontend为我们所用到的整个cbioportal的全部内容
			<div className={"cbioportal-frontend"}>
				<div className={"contentWidth"}>
					<ResultsViewPageCustom />
				</div>
			</div>
		);
	}
}
