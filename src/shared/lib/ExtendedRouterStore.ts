import { RouterStore } from "mobx-react-router";
import { action, computed } from "mobx";
import * as _ from "lodash";
import URL from "url";

export default class ExtendedRouterStore extends RouterStore {
	@action
	updateRoute(newParams: any, path = this.location.pathname) {
		let newQuery = _.clone((this.location as any).query);

		_.each(newParams, (v, k: string) => {
			if (v === undefined) {
				delete newQuery[k];
			} else {
				newQuery[k] = v;
			}
		});

		//  put a leading slash if there isn't one
		path = URL.resolve("/", path);

		this.push(URL.format({ pathname: path, query: newQuery }));
	}
}
