import * as React from "react";
import "./App.css";
import { observable, action, computed, reaction, autorun, useStrict, runInAction } from "mobx";
import { observer, inject, Observer } from "mobx-react";
import {
	labelMobxPromises,
	cached,
	debounceAsync,
	MobxPromise,
	MobxPromiseImpl,
	MobxPromiseFactory,
	MobxPromiseInputUnion
} from "mobxpromise";
import { setInterval } from "timers";
//  import onMobxPromise from './onMobxPromist';
import MutationMapper from "./pages/resultsView/mutation/MutationMapper";
import AppConfig from "appConfig";
import * as _ from "lodash";
import { remoteData } from "./shared/api/remoteData";
import { Gene } from "./shared/api/generated/CBioPortalAPI";
import { client } from "./client";
import { MutationMapperStore } from "./custom/MutationMapperStore";
import PdbHeaderCache from "./shared/cache/PdbHeaderCache";
export class Store {
	@observable geneName: string = null;
	@observable name: string = "";
	@action
	changeName = () => {
		this.name = _.random(10).toString();
		this.changeGeneName(this.name);
	};
	@action
	changeGeneName = (geneName: string) => {
		this.geneName = geneName;
	};
	@cached
	get pdbHeaderCache(): PdbHeaderCache {
		return new PdbHeaderCache();
	}
	@observable geneStore: MutationMapperStore = null;
	readonly gene = remoteData<Gene>({
		invoke: async () => {
			if (this.geneName) {
				return client.getGene(this.geneName);
			} else {
				return null;
			}
		},
		default: null,
		onResult: (gene: Gene) => {
			console.log("update genes", gene);
		}
	});
}

@observer
export class App extends React.Component<{ store: Store }, any> {
	@observable num: number = 0;
	constructor(props: any) {
		super(props);
	}
	render() {
		return (
			<div className="App" onClick={this.props.store.changeName}>
				!!{this.props.store.name}!!
				{this.renderMutationMapper()}
			</div>
		);
	}
	renderMutationMapper() {
		const mutationMapperStore: any = this.props.store.geneStore;
		if (mutationMapperStore) {
			return (
				<div className="App">
					<MutationMapper store={mutationMapperStore} pdbHeaderCache={this.props.store.pdbHeaderCache} />
				</div>
			);
		} else {
			return null;
		}
	}
}
