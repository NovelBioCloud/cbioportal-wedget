import * as _ from "lodash";
import * as React from "react";
import * as PropTypes from "prop-types";
import { Router, Route } from "react-router";
import { Provider } from "react-redux";

declare var __DEBUG__: boolean;

export interface IAppProps {
	history: any;
	routes: Route;
	routerKey: number;
	actions: any;
	store: any;
}

export default class App extends React.Component<IAppProps, void> {
	static contextTypes = {
		router: PropTypes.object
	};

	get content() {
		const { history, routes, routerKey, store, actions } = this.props;
		let newProps = { actions, ...this.props };

		const createElement = <T extends React.ComponentClass<any>>(
			Component: T,
			props: IAppProps
		) => {
			return <Component {...newProps} {...props} />;
		};

		return (
			<Provider store={store}>
				<Router key={routerKey} history={history} />
			</Provider>
		);
	}

	get devTools() {
		if (__DEBUG__) {
			if (!(window as any).devToolsExtension) {
				const DevTools = require("../DevTools/DevTools").default;
				return <DevTools />;
			} else {
				return null;
			}
		} else {
			return null;
		}
	}

	render() {
		return (
			<Provider store={this.props.store}>
				<div style={{ height: "100%" }}>
					{this.content}
					{this.devTools}
				</div>
			</Provider>
		);
	}
}
