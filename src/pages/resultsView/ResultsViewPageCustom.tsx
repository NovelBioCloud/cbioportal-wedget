import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "lodash";
import $ from "jquery";
import { observer, inject, Observer } from "mobx-react";
import { reaction, computed, observable } from "mobx";
import validateParameters from "../../shared/lib/validateParameters";
import ValidationAlert from "../../shared/components/ValidationAlert";
import AjaxErrorModal from "../../shared/components/AjaxErrorModal";
import exposeComponentRenderer from "../../shared/lib/exposeComponentRenderer";
import { ResultsViewPageStoreCustom } from "./ResultsViewPageStoreCustom";
import CancerSummaryContainer from "../../shared/components/cancerSummary/CancerSummaryContainer";
import { stringListToSet } from "../../shared/lib/StringUtils";
import * as Chart from "chart.js";
import { CancerStudy, Sample } from "../../shared/api/generated/CBioPortalAPI";
import { AppConfig } from "../../config/appConfig";
import AddThisBookmark from "../../shared/components/addThis/AddThisBookmark";
import getOverlappingStudies from "../../shared/lib/getOverlappingStudies";
import OverlappingStudiesWarning from "../../shared/components/overlappingStudiesWarning/OverlappingStudiesWarning";
import "./styles.scss";
import Mutations from "./mutation-custom/Mutations";
declare const serverVars;

(Chart as any).plugins.register({
	beforeDraw: function(chartInstance: any) {
		const ctx = chartInstance.chart.ctx;
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
	}
});
import Oncoprint, { GeneticTrackDatum } from "../../shared/components/oncoprint/Oncoprint";

const win = window as any;

export interface IResultsViewPageProps {}

type MutationsTabInitProps = {
	genes: string[];
};

type OncoprintTabInitProps = {
	divId: string;
};

@observer
export default class ResultsViewPage extends React.Component<IResultsViewPageProps, {}> {
	private store: ResultsViewPageStoreCustom;
	constructor(props: IResultsViewPageProps) {
		super(props);
		this.store = this.initStore();
	}

	public render(): any {
		return <Mutations store={this.store} />;
	}

	private initStore() {
		const resultsViewPageStore = new ResultsViewPageStoreCustom();
		resultsViewPageStore.hugoGeneSymbols = ["BRCA1", "SOX9", "TNK2", "CDH1", "BCL2"];
		return resultsViewPageStore;
	}
}
