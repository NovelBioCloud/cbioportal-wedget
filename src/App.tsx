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
//  useStrict(true);
const delay = (time: number) => {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, time);
	});
};

class AppStore {
	@observable time: number = 0;
	readonly asyncTime0 = new MobxPromise({
		invoke: async () => {
			console.log(this.time);
			await delay(1000);
			return this.time;
		},
		default: 0
	});
	readonly asyncTime1 = new MobxPromise({
		await: () => [this.asyncTime0],
		invoke: async () => {
			await delay(500);
			return this.time;
		},
		default: 0
	});
	readonly asyncTime = new MobxPromise({
		await: () => [this.asyncTime0, this.asyncTime1],
		invoke: async () => {
			await delay(500);
			return this.time;
		},
		default: 0
	});
	@action
	change() {
		this.time += 1;
	}
}
const appStore = new AppStore();
setInterval(() => {
	//  appStore.change();
}, 100);

@observer
class App extends React.Component<any, any> {
	appStore: AppStore = appStore;
	@observable num: number = 0;
	constructor(props: any) {
		super(props);
		//  onMobxPromise(this.appStore.firstData, (result) => {
		//  	this.num = result;
		//  });
	}
	render() {
		const mutationMapperStore = this.props.store.getMutationMapperStore('gene');
		return (
			<div className="App">
				<MutationMapper
					store={mutationMapperStore}
					pdbHeaderCache={this.props.store.pdbHeaderCache}
				/>
				<button
					onClick={() => {
						this.appStore.change();
					}}
				>
					reset:{this.appStore.asyncTime.result}
				</button>
				<div>{this.appStore.asyncTime.isPending && "pedding"}</div>
				<div>{this.appStore.asyncTime.isComplete && this.appStore.asyncTime.result}</div>
			</div>
		);
	}
}

export default App;
