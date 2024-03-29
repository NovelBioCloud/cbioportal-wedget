import LazyMobXCache, { AugmentedData } from "../lib/LazyMobXCache";
import {
	GeneMolecularData,
	MolecularDataFilter
} from "../api/generated/CBioPortalAPI";
import client from "../../shared/api/cbioportalClientInstance";
import _ from "lodash";
import { IDataQueryFilter } from "../lib/StoreUtils";

type Query = {
	entrezGeneId: number;
	molecularProfileId: string;
};

function queryToKey(q: Query) {
	return `${q.molecularProfileId}~${q.entrezGeneId}`;
}

function dataToKey(d: GeneMolecularData[], q: Query) {
	return `${q.molecularProfileId}~${q.entrezGeneId}`;
}

async function fetch(
	queries: Query[],
	molecularProfileIdToSampleFilter: {
		[molecularProfileId: string]: IDataQueryFilter;
	}
) {
	const molecularProfileIdToEntrezGeneIds = _.mapValues(
		_.groupBy(queries, q => q.molecularProfileId),
		profileQueries => profileQueries.map(q => q.entrezGeneId)
	);
	const params = Object.keys(molecularProfileIdToEntrezGeneIds).map(
		molecularProfileId => ({
			molecularProfileId,
			molecularDataFilter: {
				entrezGeneIds:
					molecularProfileIdToEntrezGeneIds[molecularProfileId],
				...molecularProfileIdToSampleFilter[molecularProfileId]
			} as MolecularDataFilter
		})
	);
	const results: GeneMolecularData[][] = await Promise.all(
		params.map(param =>
			client.fetchAllMolecularDataInMolecularProfileUsingPOST(param)
		)
	);
	const ret: {
		[key: string]: AugmentedData<GeneMolecularData[], Query>;
	} = {};
	for (const query of queries) {
		ret[queryToKey(query)] = {
			data: [[]],
			meta: query
		};
	}
	for (const queryResult of results) {
		for (const datum of queryResult) {
			ret[queryToKey(datum)].data[0].push(datum);
		}
	}
	return _.values(ret);
}

export default class GeneMolecularDataCache extends LazyMobXCache<
	GeneMolecularData[],
	Query,
	Query
> {
	constructor(
		private molecularProfileIdToSampleFilter: {
			[molecularProfileId: string]: IDataQueryFilter;
		}
	) {
		super(queryToKey, dataToKey, fetch, molecularProfileIdToSampleFilter);
	}
}
