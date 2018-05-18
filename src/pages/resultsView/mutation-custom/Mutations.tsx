import * as React from "react";
import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import { MSKTabs, MSKTab } from "../../../shared/components/MSKTabs/MSKTabs";
import MutationMapper from "./MutationMapper";
import { AppConfig } from "../../../config/appConfig";	// 配置信息
import "./mutations.scss";	// 样式css
import Loader from "../../../shared/components/loadingIndicator/LoadingIndicator";	// 加载页面
import { MutationMapperStore } from "./MutationMapperStore";
import { ResultsViewPageStoreCustom } from "../ResultsViewPageStoreCustom";
export interface IMutationsPageProps {
	store: ResultsViewPageStoreCustom;
}

@observer
export default class Mutations extends React.Component<IMutationsPageProps, {}> {
	@observable mutationsGeneTab: string;
	// this.props.store.hugoGeneSymbols![0]与this.props.store.hugoGeneSymbols[0]拿到的结果是一样的值
	constructor(props: IMutationsPageProps) {
		super(props);
		this.handleTabChange.bind(this);
		this.mutationsGeneTab = this.props.store.hugoGeneSymbols![0];
	}
	// loader加载页面, mskTabs页面内容
	public render() {
		const activeTabId = this.mutationsGeneTab;
		return (
			<div>
				<Loader isLoading={this.props.store.mutationMapperStores.isPending} />
				{this.props.store.mutationMapperStores.isComplete && (	// 远程数据加载完成后再渲染页面
					<MSKTabs
						id="mutationsPageTabs"
						activeTabId={activeTabId}
						onTabClick={(id: string) => this.handleTabChange(id)}
						className="secondaryTabs resultsPageMutationsGeneTabs"
						enablePagination={true}
						arrowStyle={{ lineHeight: 0.8 }}
						tabButtonStyle="pills"
						unmountOnHide={true}
					>
						{this.generateTabs(this.props.store.hugoGeneSymbols!)}
					</MSKTabs>
				)}
			</div>
		);
	}
	protected generateTabs(genes: string[]) {
		const tabs: JSX.Element[] = [];
		genes.forEach((gene: string) => {
			const mutationMapperStore: MutationMapperStore = this.props.store.getMutationMapperStore(gene);
			if (mutationMapperStore) {
				tabs.push(
					<MSKTab key={gene} id={gene} linkText={gene}>
						<MutationMapper
							store={mutationMapperStore}
							discreteCNACache={this.props.store.discreteCNACache}
							genomeNexusEnrichmentCache={this.props.store.genomeNexusEnrichmentCache}
							pubMedCache={this.props.store.pubMedCache}
							cancerTypeCache={this.props.store.cancerTypeCache}
							mutationCountCache={this.props.store.mutationCountCache}
							pdbHeaderCache={this.props.store.pdbHeaderCache}
							config={AppConfig as any}
						/>
					</MSKTab>
				);
			}
		});

		return tabs;
	}

	protected handleTabChange(id: string) {
		this.mutationsGeneTab = id;
	}
}
