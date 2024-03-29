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
import { ResultsViewPageStore, SamplesSpecificationElement } from "./ResultsViewPageStore";
import CancerSummaryContainer from "../../shared/components/cancerSummary/CancerSummaryContainer";
import { stringListToSet } from "../../shared/lib/StringUtils";
import * as Chart from "chart.js";
import { CancerStudy, Sample } from "../../shared/api/generated/CBioPortalAPI";
import { AppConfig } from "../../config/appConfig";
import AddThisBookmark from "../../shared/components/addThis/AddThisBookmark";
import getOverlappingStudies from "../../shared/lib/getOverlappingStudies";
import OverlappingStudiesWarning from "../../shared/components/overlappingStudiesWarning/OverlappingStudiesWarning";
import "./styles.scss";
import Mutations from "./mutation/Mutations";
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
	samplesSpecification: SamplesSpecificationElement[];
};

type OncoprintTabInitProps = {
	divId: string;
};

@observer
export default class ResultsViewPage extends React.Component<IResultsViewPageProps, {}> {
	private resultsViewPageStore: ResultsViewPageStore;

	constructor(props: IResultsViewPageProps) {
		super(props);
		const resultsViewPageStore = this.initStore();
		this.resultsViewPageStore = resultsViewPageStore;
		(window as any).resultsViewPageStore = resultsViewPageStore;
	}

	public render(): any {
		return (
			<div>
				<Mutations store={this.resultsViewPageStore} />
			</div>
		);
	}

	private initStore() {
		const oqlQuery = serverVars.theQuery;
		// @fixed by renyaoxiang
		// const parsedOQL = (window as any).oql_parser.parse(oqlQuery);
		const parsedOQL = oqlQuery.split(" ").map(it => ({
			gene: it
		}));
		console.log(parsedOQL);
		const resultsViewPageStore = new ResultsViewPageStore();

		//  following is a bunch of dirty stuff necessary to read state from jsp page
		//  ultimate we will phase this out and this information will be stored in router etc.
		//  const qSession:any = (window as any).QuerySession;
		var samplesSpecification: any = [];
		resultsViewPageStore.samplesSpecification = samplesSpecification;
		resultsViewPageStore.hugoGeneSymbols = _.map(parsedOQL, (o: any) => o.gene); //  qSession.getQueryGenes();
		resultsViewPageStore.selectedMolecularProfileIds = serverVars.molecularProfiles; //  qSession.getGeneticProfileIds();
		resultsViewPageStore.rppaScoreThreshold = serverVars.rppaScoreThreshold; //  FIX!
		resultsViewPageStore.zScoreThreshold = serverVars.zScoreThreshold;
		resultsViewPageStore.oqlQuery = oqlQuery;

		return resultsViewPageStore;
	}
}
