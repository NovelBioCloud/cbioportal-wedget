import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "lodash";
import $ from "jquery";
import { observer } from "mobx-react";
import { ResultsViewPageStoreCustom } from "./ResultsViewPageStoreCustom";
import * as Chart from "chart.js";
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
	private hugoGeneSymbols: string[] = ["BRCA1", "SOX9", "TNK2", "CDH1", "BCL2", 'TP53'];
	constructor(props: IResultsViewPageProps) {
		super(props);
		this.store = this.initStore();
	}

	public render(): any {
		// input为检索框 mutations为主体部分(由图片和表格组成)
		return (
			<div>
				<input
					onChange={e => {
						const value = e.target.value;
						this.store.hugoGeneSymbols = [value];
					}}
				/>
				<Mutations store={this.store} />
			</div>
		);
	}

	private initStore() {
		const serverVars: any = (window as any).serverVars;
		const resultsViewPageStore = new ResultsViewPageStoreCustom();
		var samplesSpecification: any = [];
		if (serverVars.caseSetProperties.case_set_id === "all") {
			// "all" means all cases in the queried stud(y/ies) - not an actual case set that could be queried
			var studyToSampleMap = serverVars.studySampleObj;
			var studies = Object.keys(studyToSampleMap);
			for (var i = 0; i < studies.length; i++) {
				var study = studies[i];
				samplesSpecification = samplesSpecification.concat(studyToSampleMap[study].map(function(sampleId: string) {
					return {
						sampleId: sampleId,
						studyId: study
					};
				}));
			}
		} else if (serverVars.caseIds) {
			// populated if custom case list
			samplesSpecification = samplesSpecification.concat(serverVars.caseIds.trim().split(/\+/).map((c: string) => {
				const elts = c.split(":");
				return {
					studyId: elts[0],
					sampleId: elts[1]
				};
			}));
		} else {
			// case set
			var studies = Object.keys(serverVars.studySampleListMap);
			for (var i = 0; i < studies.length; i++) {
				samplesSpecification.push({
					sampleListId: serverVars.studySampleListMap[studies[i]],
					studyId: studies[i]
				});
			}
		}
		resultsViewPageStore.samplesSpecification = samplesSpecification;
		resultsViewPageStore.hugoGeneSymbols = ["BRCA1", "SOX9", "TNK2", "CDH1", "BCL2", 'TP53'];
		resultsViewPageStore.selectedMolecularProfileIds = serverVars.molecularProfiles;
		return resultsViewPageStore;
	}
	
}
