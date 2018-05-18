import { HotspotMutation } from "shared/api/generated/CancerHotspotsAPI";
import HotspotSet from "shared/lib/HotspotSet";
import { AggregatedHotspots } from "shared/api/generated/GenomeNexusAPIInternal";

export interface IHotspotIndex {
	/*  [gene: string]: {
		[hotspotType: string]: IHotspotLookup;
	};  */
	[genomicLocation: string]: AggregatedHotspots;
}

export interface IHotspotLookup {
	hotspotMutations: HotspotMutation[];
	hotspotSet: HotspotSet;
}

export interface IHotspotData {
	single: IHotspotIndex;
	clustered: IHotspotIndex;
}

export interface IHotspotDataWrapper {
	status: "pending" | "error" | "complete";
	result?: IHotspotIndex;
}

export interface ICancerHotspotData {
	single: HotspotMutation[];
	clustered: HotspotMutation[];
}
