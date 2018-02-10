import {
	DiscreteCopyNumberFilter,
	DiscreteCopyNumberData,
	ClinicalData,
	ClinicalDataMultiStudyFilter,
	Sample,
	SampleIdentifier,
	MolecularProfile,
	Mutation,
	GeneMolecularData,
	MolecularDataFilter,
	Gene,
	ClinicalDataSingleStudyFilter,
	CancerStudy,
	PatientIdentifier,
	Patient,
	GenePanelData,
	GenePanelDataFilter,
	SampleList,
	MutationCountByPosition,
	MutationMultipleStudyFilter,
	SampleMolecularIdentifier,
	MolecularDataMultipleStudyFilter,
	SampleFilter,
	MolecularProfileFilter,
	GenePanelMultipleStudyFilter
} from "../../shared/api/generated/CBioPortalAPI";
import client from "../../shared/api/cbioportalClientInstance";
import { computed, observable, action } from "mobx";
import { remoteData, addErrorHandler } from "../../shared/api/remoteData";
import { labelMobxPromises, cached, MobxPromise } from "mobxpromise";
import OncoKbEvidenceCache from "../../shared/cache/OncoKbEvidenceCache";
import PubMedCache from "../../shared/cache/PubMedCache";
import CancerTypeCache from "../../shared/cache/CancerTypeCache";
import MutationCountCache from "../../shared/cache/MutationCountCache";
import DiscreteCNACache from "../../shared/cache/DiscreteCNACache";
import GenomeNexusEnrichmentCache from "../../shared/cache/GenomeNexusEnrichment";
import PdbHeaderCache from "../../shared/cache/PdbHeaderCache";
import {
	findMolecularProfileIdDiscrete,
	fetchMyCancerGenomeData,
	fetchDiscreteCNAData,
	findMutationMolecularProfileId,
	mergeDiscreteCNAData,
	fetchSamples,
	fetchClinicalDataInStudy,
	generateDataQueryFilter,
	fetchSamplesWithoutCancerTypeClinicalData,
	fetchStudiesForSamplesWithoutCancerTypeClinicalData,
	IDataQueryFilter,
	isMutationProfile,
	fetchOncoKbAnnotatedGenes,
	groupBy,
	fetchHotspotsData,
	indexHotspotData,
	fetchOncoKbData,
	ONCOKB_DEFAULT,
	generateUniqueSampleKeyToTumorTypeMap,
	cancerTypeForOncoKb,
	fetchCnaOncoKbData,
	fetchCnaOncoKbDataWithGeneMolecularData,
	fetchGermlineConsentedSamples
} from "../../shared/lib/StoreUtils";
import { MutationMapperStore } from "./mutation-custom/MutationMapperStore";
import { AppConfig } from "../../config/appConfig";
import * as _ from "lodash";
import { stringListToIndexSet, stringListToSet } from "../../shared/lib/StringUtils";
import { toSampleUuid } from "../../shared/lib/UuidUtils";
import MutationDataCache from "../../shared/cache/MutationDataCache";
import Accessors, { getSimplifiedMutationType, SimplifiedMutationType } from "../../shared/lib/oql/accessors";
import { filterCBioPortalWebServiceData } from "../../shared/lib/oql/oqlfilter.js";
import { keepAlive } from "mobx-utils";
import { CacheData } from "../../shared/lib/LazyMobXCache";
import { IAlterationCountMap, IAlterationData } from "../../shared/components/cancerSummary/CancerSummaryContent";
import { PatientSurvival } from "../../shared/model/PatientSurvival";
import { filterCBioPortalWebServiceDataByOQLLine, OQLLineFilterOutput } from "../../shared/lib/oql/oqlfilter";
import GeneMolecularDataCache from "../../shared/cache/GeneMolecularDataCache";
import GeneCache from "../../shared/cache/GeneCache";
import ClinicalDataCache from "../../shared/cache/ClinicalDataCache";
import { IHotspotData } from "../../shared/model/CancerHotspots";
import { isHotspot } from "../../shared/lib/AnnotationUtils";
import { IOncoKbData } from "../../shared/model/OncoKB";
import { generateQueryVariantId } from "../../shared/lib/OncoKbUtils";
import { CosmicMutation } from "../../shared/api/generated/CBioPortalAPIInternal";
import internalClient from "../../shared/api/cbioportalInternalClientInstance";
import { IndicatorQueryResp } from "../../shared/api/generated/OncoKbAPI";
import { getAlterationString } from "../../shared/lib/CopyNumberUtils";
import memoize from "memoize-weak-decorator";
import request from "superagent";
import { countMutations, mutationCountByPositionKey } from "./mutationCountHelpers";
import { getPatientSurvivals } from "./SurvivalStoreHelper";
import { QueryStore } from "../../shared/components/query/QueryStore";
import {
	annotateMolecularDatum,
	getOncoKbOncogenic,
	computeCustomDriverAnnotationReport,
	computePutativeDriverAnnotatedMutations,
	initializeCustomDriverAnnotationSettings
} from "./ResultsViewPageStoreUtils";

export class ResultsViewPageStoreCustom {
	constructor() {
		labelMobxPromises(this);
	}

	@observable hugoGeneSymbols: string[];

	@observable zScoreThreshold: number;

	@observable rppaScoreThreshold: number;

	@observable oqlQuery: string = "";
	@observable public sessionIdURL = "";

	@observable selectedMolecularProfileIds: string[] = [];

	@observable
	mutationAnnotationSettings = {
		ignoreUnknown: AppConfig.oncoprintHideVUSDefault,
		cbioportalCount: false,
		cbioportalCountThreshold: 10,
		cosmicCount: false,
		cosmicCountThreshold: 10,
		hotspots: !AppConfig.oncoprintOncoKbHotspotsDefault,
		oncoKb: !AppConfig.oncoprintOncoKbHotspotsDefault,
		driverFilter: AppConfig.oncoprintCustomDriverAnnotationDefault,
		driverTiers: observable.map<boolean>()
	};

	readonly selectedMolecularProfiles = remoteData<MolecularProfile[]>({
		await: () => [],
		invoke: async () => {
			const idLookupMap = _.keyBy(this.selectedMolecularProfileIds, (id: string) => id); //  optimization
			return [];
		}
	});

	readonly molecularData = remoteData<GeneMolecularData[]>({
		await: () => [this.genes, this.selectedMolecularProfiles],
		invoke: () => {
			return Promise.resolve([]);
		}
	});

	readonly unfilteredAlterations = remoteData<(Mutation | GeneMolecularData)[]>({
		await: () => [this.mutations, this.molecularData],
		invoke: () => {
			let result: (Mutation | GeneMolecularData)[] = [];
			result = result.concat(this.mutations.result!);
			result = result.concat(this.molecularData.result!);
			return Promise.resolve(result);
		}
	});

	/**
	 * 获取基因数据
	 */
	readonly genes = remoteData(async () => {
		if (this.hugoGeneSymbols && this.hugoGeneSymbols.length) {
			const order = stringListToIndexSet(this.hugoGeneSymbols);
			return _.sortBy(
				await client.fetchGenesUsingPOST({
					geneIdType: "HUGO_GENE_SYMBOL",
					geneIds: this.hugoGeneSymbols.slice(),
					projection: "SUMMARY"
				}),
				(gene: Gene) => order[gene.hugoGeneSymbol]
			);
		} else {
			return [];
		}
	});

	readonly mutations = remoteData<Mutation[]>({
		await: () => [this.genes],
		invoke: async () => {
			const mutationProfiles = _.filter(
				this.selectedMolecularProfiles.result,
				(profile: MolecularProfile) => profile.molecularAlterationType === "MUTATION_EXTENDED"
			);

			if (mutationProfiles.length === 0) {
				return [];
			}

			const data = {
				entrezGeneIds: _.map(this.genes.result, (gene: Gene) => gene.entrezGeneId)
			} as MutationMultipleStudyFilter;

			return await client.fetchMutationsInMultipleMolecularProfilesUsingPOST({
				projection: "DETAILED",
				mutationMultipleStudyFilter: data
			});
		}
	});

	@computed
	get mutationsByGene(): { [hugeGeneSymbol: string]: Mutation[] } {
		return _.groupBy(this.mutations.result, (mutation: Mutation) => mutation.gene.hugoGeneSymbol);
	}
	@cached
	get mutationDataCache() {
		return new MutationDataCache(null, null);
	}
	readonly mutationMapperStores = remoteData<{
		[hugoGeneSymbol: string]: MutationMapperStore;
	}>(
		{
			await: () => [this.genes, this.mutations],
			invoke: () => {
				if (this.genes.result) {
					//  we have to use _.reduce, otherwise this.genes.result (Immutable, due to remoteData) will return
					//   an Immutable as the result of reduce, and MutationMapperStore when it is made immutable all the
					//   mobx machinery going on in the readonly remoteDatas and observables somehow gets messed up.
					return Promise.resolve(
						_.reduce(
							this.genes.result,
							(
								map: {
									[hugoGeneSymbol: string]: MutationMapperStore;
								},
								gene: Gene
							) => {
								map[gene.hugoGeneSymbol] = new MutationMapperStore(
									AppConfig,
									gene,
									this.mutationsByGene[gene.hugoGeneSymbol],
									// () => this.mutationDataCache,
									// () => this.genomeNexusEnrichmentCache,
									() => this.mutationCountCache,
									// this.studyIdToStudy,
									// this.molecularProfileIdToMolecularProfile,
									// this.clinicalDataForSamples,
									// this.studiesForSamplesWithoutCancerTypeClinicalData,
									// this.samplesWithoutCancerTypeClinicalData,
									// this.germlineConsentedSamples,
									// this.indexedHotspotData,
									// this.uniqueSampleKeyToTumorType.result!,
									// this.oncoKbData
								);
								return map;
							},
							{}
						)
					);
				} else {
					return Promise.resolve({});
				}
			}
		},
		{}
	);

	public getMutationMapperStore(hugoGeneSymbol: string): MutationMapperStore | undefined {
		return this.mutationMapperStores.result[hugoGeneSymbol];
	}

	//  COSMIC count
	readonly cosmicCountData = remoteData<CosmicMutation[]>({
		await: () => [this.mutations],
		invoke: () => {
			return internalClient.fetchCosmicCountsUsingPOST({
				keywords: _.uniq(
					this.mutations.result!
						.filter((m: Mutation) => {
							const simplifiedMutationType = getSimplifiedMutationType(m.mutationType);
							return (
								(simplifiedMutationType === "missense" || simplifiedMutationType === "inframe") &&
								!!m.keyword
							);
						})
						.map((m: Mutation) => m.keyword)
				)
			});
		}
	});

	readonly getCosmicCount: MobxPromise<(mutation: Mutation) => number> = remoteData({
		await: () => [this.cosmicCountData],
		invoke: () => {
			const countMap = _.groupBy(this.cosmicCountData.result!, d => d.keyword);
			return Promise.resolve((mutation: Mutation): number => {
				const keyword = mutation.keyword;
				const counts = countMap[keyword];
				if (counts) {
					return counts.reduce((count, next: CosmicMutation) => {
						return count + next.count;
					}, 0);
				} else {
					return -1;
				}
			});
		}
	});

	@cached
	get pubMedCache() {
		return new PubMedCache();
	}

	@cached
	get genomeNexusEnrichmentCache() {
		return new GenomeNexusEnrichmentCache();
	}

	@cached
	get cancerTypeCache() {
		return new CancerTypeCache();
	}

	@cached
	get mutationCountCache() {
		return new MutationCountCache();
	}

	@cached
	get pdbHeaderCache() {
		return new PdbHeaderCache();
	}

	@cached
	get geneCache() {
		return new GeneCache();
	}
}
