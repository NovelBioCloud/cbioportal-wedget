import {
	MolecularProfile,
	GeneMolecularData,
	Mutation,
	Gene,
	MutationMultipleStudyFilter,
	MolecularProfileFilter,
	Sample,
	SampleFilter,
	SampleIdentifier,
	ClinicalData,
	ClinicalDataSingleStudyFilter,
	ClinicalDataMultiStudyFilter
} from "../../shared/api/generated/CBioPortalAPI";
import { toSampleUuid } from "../../shared/lib/UuidUtils";
import { 
	IDataQueryFilter, 
	generateDataQueryFilter, 
	fetchOncoKbAnnotatedGenes, 
	fetchStudiesForSamplesWithoutCancerTypeClinicalData, 
	fetchGermlineConsentedSamples ,
	generateUniqueSampleKeyToTumorTypeMap,
	fetchOncoKbData,
	ONCOKB_DEFAULT
} from "../../shared/lib/StoreUtils";
import { IOncoKbData } from "../../shared/model/OncoKB";
import { IHotspotIndex } from "../../shared/model/CancerHotspots";
import { indexHotspotsData, fetchHotspotsData } from "../../shared/lib/CancerHotspotsUtils";
import client from "../../shared/api/cbioportalClientInstance";
import { computed, observable, action } from "mobx";
import { remoteData, addErrorHandler } from "../../shared/api/remoteData";
import { labelMobxPromises, cached, MobxPromise } from "mobxpromise";
import PubMedCache from "../../shared/cache/PubMedCache";
import CancerTypeCache from "../../shared/cache/CancerTypeCache";
import MutationCountCache from "../../shared/cache/MutationCountCache";
import GenomeNexusEnrichmentCache from "../../shared/cache/GenomeNexusEnrichment";
import PdbHeaderCache from "../../shared/cache/PdbHeaderCache";
import { MutationMapperStore } from "./mutation-custom/MutationMapperStore";
import { AppConfig } from "../../config/appConfig";
import * as _ from "lodash";
import { stringListToIndexSet } from "../../shared/lib/StringUtils";
import MutationDataCache from "../../shared/cache/MutationDataCache";
import Accessors, { getSimplifiedMutationType, SimplifiedMutationType } from "../../shared/lib/oql/accessors";
import GeneCache from "../../shared/cache/GeneCache";
import { CosmicMutation } from "../../shared/api/generated/CBioPortalAPIInternal";
import internalClient from "../../shared/api/cbioportalInternalClientInstance";
import DiscreteCNACache from "../../shared/cache/DiscreteCNACache";
export type SamplesSpecificationElement =
	| { studyId: string; sampleId: string; sampleListId: undefined }
	| { studyId: string; sampleId: undefined; sampleListId: string };
/**
 * 存放Mutations的props
 */
export class ResultsViewPageStoreCustom {
	constructor() {
		labelMobxPromises(this);
	}

	@observable hugoGeneSymbols: string[];	// 雨果基因符号

	@observable samplesSpecification: SamplesSpecificationElement[] = [];

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
	// mutations
	readonly selectedMolecularProfiles = remoteData<MolecularProfile[]>({
		await: () => [
			 this.molecularProfilesInStudies 
		],
		invoke: async () => {
			const idLookupMap = _.keyBy(this.selectedMolecularProfileIds, (id: string) => id); //  optimization
			return  Promise.resolve(
				this.molecularProfilesInStudies.result! .filter(
					(profile: MolecularProfile) => profile.molecularProfileId in idLookupMap
				) 
			);
		}
	});
	readonly molecularProfilesInStudies = remoteData<MolecularProfile[]>(
		{
			await: () => [this.studyIds],
			invoke: async () => {
				return client.fetchMolecularProfilesUsingPOST({
					molecularProfileFilter: {
						studyIds: this.studyIds.result!
					} as MolecularProfileFilter
				});
			}
		},
		[]
	);

	// studyToDataQueryFilter
	readonly studyIds = remoteData({
		await: () => [this.studyToSampleIds],
		invoke: () => {
			return Promise.resolve(Object.keys(this.studyToSampleIds.result));
		}
	});
	readonly studyToSampleIds = remoteData<{
		[studyId: string]: { [sampleId: string]: boolean };
	}>(async () => {
		const sampleListsToQuery: {
			studyId: string;
			sampleListId: string;
		}[] = [];
		const ret: { [studyId: string]: { [sampleId: string]: boolean } } = {};
		for (const sampleSpec of this.samplesSpecification) {
			if (sampleSpec.sampleId) {
				ret[sampleSpec.studyId] = ret[sampleSpec.studyId] || {};
				ret[sampleSpec.studyId][sampleSpec.sampleId] = true;
			} else if (sampleSpec.sampleListId) {
				sampleListsToQuery.push(sampleSpec as {
					studyId: string;
					sampleListId: string;
				});
			}
		}
		const results: string[][] = await Promise.all(
			sampleListsToQuery.map(spec => {
				return client.getAllSampleIdsInSampleListUsingGET({
					sampleListId: spec.sampleListId
				});
			})
		);
		for (let i = 0; i < results.length; i++) {
			ret[sampleListsToQuery[i].studyId] = ret[sampleListsToQuery[i].studyId] || {};
			const sampleMap = ret[sampleListsToQuery[i].studyId];
			results[i].map(sampleId => {
				sampleMap[sampleId] = true;
			});
		}
		return ret;
	}, {});
	@computed
	get studyToSampleListId(): { [studyId: string]: string } {
		return this.samplesSpecification.reduce(
			(map, next) => {
				if (next.sampleListId) {
					map[next.studyId] = next.sampleListId;
				}
				return map;
			},
			{} as { [studyId: string]: string }
		);
	}
	/* readonly molecularData = remoteData<GeneMolecularData[]>({
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
	}); */

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
		await: () => [
			this.genes,
			this.selectedMolecularProfiles,
			this.samples
		],
		invoke: async () => {
			const mutationProfiles = _.filter(
				this.selectedMolecularProfiles.result,
				(profile: MolecularProfile) => profile.molecularAlterationType === "MUTATION_EXTENDED"
			);

			if (mutationProfiles.length === 0) {
				return [];
			}

			const studyIdToProfileMap: { [studyId: string]: MolecularProfile } = _.keyBy(mutationProfiles, (profile: MolecularProfile) => profile.studyId);

			const filters = this.samples.result.reduce((memo, sample: Sample) =>  {
				if (sample.studyId in studyIdToProfileMap) {
					memo.push({
						molecularProfileId: studyIdToProfileMap[sample.studyId].molecularProfileId,
						sampleId: sample.sampleId
					});
				}
				return memo;
			}, [] as any[]);
			const data = {
				entrezGeneIds: _.map(this.genes.result, (gene: Gene) => gene.entrezGeneId),
				sampleMolecularIdentifiers: filters
			} as MutationMultipleStudyFilter;
			return await client.fetchMutationsInMultipleMolecularProfilesUsingPOST({
				projection: "DETAILED",
				mutationMultipleStudyFilter: data
			});
		}
	});
	readonly  samples = remoteData({
		await: () => [
			this.studyToDataQueryFilter
		],
		invoke: async() => {

			let sampleIdentifiers: SampleIdentifier[] = [];
			let sampleListIds: string[] = [];
			_.each(this.studyToDataQueryFilter.result, (dataQueryFilter: IDataQueryFilter, studyId: string) => {
				if (dataQueryFilter.sampleIds) {
					sampleIdentifiers = sampleIdentifiers.concat(dataQueryFilter.sampleIds.map(sampleId => ({
						sampleId,
						studyId
					})));
				} else if (dataQueryFilter.sampleListId) {
					sampleListIds.push(dataQueryFilter.sampleListId);
				}
			});
			let promises: Promise< Sample[]>[] = [];
			if (sampleIdentifiers.length) {
				promises.push(client.fetchSamplesUsingPOST({
					sampleFilter: {
						sampleIdentifiers
					} as SampleFilter
				}));
			}
			if (sampleListIds.length) {
				promises.push(client.fetchSamplesUsingPOST({
					sampleFilter: {
						sampleListIds
					} as SampleFilter
				}));
			}
			return _.flatten(await Promise.all(promises));
		}
		}, []);

		readonly studyToDataQueryFilter = remoteData<{ [studyId: string]: IDataQueryFilter }>({
			await: () => [/* this.studyToSampleIds, */ this.studyIds],
			invoke: () => {
				const studies = this.studyIds.result!;
				const ret: { [studyId: string]: IDataQueryFilter } = {};
				for (const studyId of studies) {
					ret[studyId] = generateDataQueryFilter(this.studyToSampleListId[studyId] || null, Object.keys(this.studyToSampleIds.result[studyId] || {}))
				}
				return Promise.resolve(ret);
			}
		}, {});

	readonly oncoKbAnnotatedGenes = remoteData({
		invoke: () => fetchOncoKbAnnotatedGenes(),
		onError: (err: Error) => {
			// fail silently, leave the error handling responsibility to the data consumer
		}
	}, {});
	// new MutationMapperStore的参数
	readonly studyIdToStudy = remoteData({
		await: () => [this.studies],
		invoke: () => Promise.resolve(_.keyBy(this.studies.result, x => x.studyId))
	}, {});

	readonly studies = remoteData({
		await: () => [this.studyIds],
		invoke: async () => {
			return client.fetchStudiesUsingPOST({
				studyIds: this.studyIds.result!,
				projection: 'DETAILED'
			})
		}
	}, []);

	readonly molecularProfileIdToMolecularProfile = remoteData<{ [molecularProfileId: string]: MolecularProfile }>({
		await: () => [this.molecularProfilesInStudies],
		invoke: () => {
			return Promise.resolve(this.molecularProfilesInStudies.result.reduce((map: { [molecularProfileId: string]: MolecularProfile }, next: MolecularProfile) => {
				map[next.molecularProfileId] = next;
				return map;
			}, {}));
		}
	}, {});
	// samplesWithoutCancerTypeClinicalData
	readonly clinicalDataForSamples = remoteData<ClinicalData[]>({
		await: () => [
			this.studies,
			this.samples
		],
		invoke: () => this.getClinicalData("SAMPLE", this.samples.result, ["CANCER_TYPE", "CANCER_TYPE_DETAILED"])
	}, []);
	
	private getClinicalData(clinicalDataType: "SAMPLE" | "PATIENT", entities: any[], attributeIds: string[]):
	Promise<Array<ClinicalData>> {

		// single study query endpoint is optimal so we should use it
		// when there's only one study
		if (this.studies.result.length === 1) {
			const study = this.studies.result[0];
			const filter: ClinicalDataSingleStudyFilter = {
				attributeIds: attributeIds,
				ids: _.map(entities, clinicalDataType === "SAMPLE" ? 'sampleId' : 'patientId')
			};
			return client.fetchAllClinicalDataInStudyUsingPOST({
				studyId: study.studyId,
				clinicalDataSingleStudyFilter: filter,
				clinicalDataType: clinicalDataType
			});
		} else {
			const filter: ClinicalDataMultiStudyFilter = {
				attributeIds: attributeIds,
				identifiers: entities.map((s: any) => clinicalDataType === "SAMPLE" ?
					({entityId: s.sampleId, studyId: s.studyId}) : ({entityId: s.patientId, studyId: s.studyId}))
			};
			return client.fetchClinicalDataUsingPOST({
				clinicalDataType: clinicalDataType,
				clinicalDataMultiStudyFilter: filter
			});
		}
	}
	// uniqueSampleKeyToTumorType
	readonly studiesForSamplesWithoutCancerTypeClinicalData = remoteData({
		await: () => [
			this.samplesWithoutCancerTypeClinicalData
		],
		invoke: async () => fetchStudiesForSamplesWithoutCancerTypeClinicalData(this.samplesWithoutCancerTypeClinicalData)
	}, []);
	// studiesForSamplesWithoutCancerTypeClinicalData
	readonly samplesWithoutCancerTypeClinicalData = remoteData<Sample[]>({
		await: () => [
			// this.samples,
			this.clinicalDataForSamples
		],
		invoke: () => {
			const sampleHasData: { [sampleUid: string]: boolean } = {};
			for (const data of this.clinicalDataForSamples.result) {
				sampleHasData[toSampleUuid(data.studyId, data.sampleId)] = true;
			}
			return Promise.resolve(this.samples.result.filter(sample => {
				return !sampleHasData[toSampleUuid(sample.studyId, sample.sampleId)];
			}));
		}
	}, []);

	readonly germlineConsentedSamples = remoteData<SampleIdentifier[]>({
		await: () => [this.studyIds],
		invoke: async() => await fetchGermlineConsentedSamples(this.studyIds, AppConfig.studiesWithGermlineConsentedSamples),
		onError: () => {
			// fail silently
		}
	}, []);
	
	readonly indexedHotspotData = remoteData<IHotspotIndex|undefined>({
		await: () => [
			this.hotspotData
		],
		invoke: () => Promise.resolve(indexHotspotsData(this.hotspotData))
	});
	
	readonly hotspotData = remoteData({
		await: () => [
			this.mutations
		],
		invoke: () => {
			return fetchHotspotsData(this.mutations);
		}
	});
	// new MutationMapperStore参数
	readonly oncoKbData = remoteData<IOncoKbData>({
		await: () => [
			this.mutations,
			// this.clinicalDataForSamples,
			// this.studiesForSamplesWithoutCancerTypeClinicalData,
			this.uniqueSampleKeyToTumorType,
			this.oncoKbAnnotatedGenes
		],
		invoke: () => fetchOncoKbData(this.uniqueSampleKeyToTumorType.result!, this.oncoKbAnnotatedGenes.result!, this.mutations),
		onError: (err: Error) => {
			// fail silently, leave the error handling responsibility to the data consumer
		}
	}, ONCOKB_DEFAULT);

	 // OncoKb
	readonly uniqueSampleKeyToTumorType = remoteData<{[uniqueSampleKey: string]: string}>({
		await: () => [
			// this.clinicalDataForSamples,
			this.studiesForSamplesWithoutCancerTypeClinicalData,
			// this.samplesWithoutCancerTypeClinicalData
		],
		invoke: () => {
			return Promise.resolve(generateUniqueSampleKeyToTumorTypeMap(this.clinicalDataForSamples,
				this.studiesForSamplesWithoutCancerTypeClinicalData,
				this.samplesWithoutCancerTypeClinicalData));
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
	readonly mutationMapperStores = remoteData<{	// remoteData 远程数据
		[hugoGeneSymbol: string]: MutationMapperStore;
	}>(
		{
			await: () => [/* this.genes, */ this.mutations],
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
									this.samples,
									this.oncoKbAnnotatedGenes.result || {},
									this.mutationsByGene[gene.hugoGeneSymbol],
									() => (this.mutationDataCache),
									() => (this.genomeNexusEnrichmentCache),
									() => (this.mutationCountCache),
									this.studyIdToStudy,
									this.molecularProfileIdToMolecularProfile,
									this.clinicalDataForSamples,
									this.studiesForSamplesWithoutCancerTypeClinicalData,
									this.samplesWithoutCancerTypeClinicalData,
									this.germlineConsentedSamples,
									this.indexedHotspotData,
									this.uniqueSampleKeyToTumorType.result!,
									this.oncoKbData
								);
								return map;
							},
							{}
						)
					);

					// 	return Promise.resolve(
					// 	_.reduce(
					// 		this.genes.result,
					// 		(
					// 			map: {
					// 				[hugoGeneSymbol: string]: MutationMapperStore;
					// 			},
					// 			gene: Gene
					// 		) => {
								
					// 			return map;
					// 		},
					// 		{}
					// 	)
					// );
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
	/* readonly cosmicCountData = remoteData<CosmicMutation[]>({
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
	}); */

	/* readonly getCosmicCount: MobxPromise<(mutation: Mutation) => number> = remoteData({
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
	}); */
	readonly studyToMolecularProfileDiscrete = remoteData<{ [studyId: string]: MolecularProfile }>({
		await: () => [
			this.molecularProfilesInStudies
		],
		invoke: async () => {
			const ret: { [studyId: string]: MolecularProfile } = {};
			for (const molecularProfile of this.molecularProfilesInStudies.result) {
				if (molecularProfile.datatype === "DISCRETE") {
					ret[molecularProfile.studyId] = molecularProfile;
				}
			}
			return ret;
		}
	}, {});

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
	
	@cached 
	get discreteCNACache() {
		return new DiscreteCNACache(this.studyToMolecularProfileDiscrete.result);
	}
}
