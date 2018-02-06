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
		// if (this.hugoGeneSymbols) {
		// 	return client.fetchGenesUsingPOST({
		// 		geneIds: this.hugoGeneSymbols.slice(),
		// 		geneIdType: "HUGO_GENE_SYMBOL"
		// 	});
		// }
		// return undefined;
		return [
			{
				entrezGeneId: 596,
				hugoGeneSymbol: "BCL2",
				type: "protein-coding",
				cytoband: "18q21.33",
				length: 196433,
				chromosome: "18"
			},
			{
				entrezGeneId: 672,
				hugoGeneSymbol: "BRCA1",
				type: "protein-coding",
				cytoband: "17q21.31",
				length: 81189,
				chromosome: "17"
			},
			{
				entrezGeneId: 999,
				hugoGeneSymbol: "CDH1",
				type: "protein-coding",
				cytoband: "16q22.1",
				length: 98253,
				chromosome: "16"
			},
			{
				entrezGeneId: 6662,
				hugoGeneSymbol: "SOX9",
				type: "protein-coding",
				cytoband: "17q24.3",
				length: 5401,
				chromosome: "17"
			},
			{
				entrezGeneId: 10188,
				hugoGeneSymbol: "TNK2",
				type: "protein-coding",
				cytoband: "3q29",
				length: 45646,
				chromosome: "3"
			}
		];
	});

	readonly mutations = remoteData<Mutation[]>({
		await: () => [this.genes],
		invoke: async () => {
			const result: Mutation[] = [
				{
					uniqueSampleKey: "VENHQS00NC03NjcwLTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS00NC03NjcwOmx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-44-7670-01",
					patientId: "TCGA-44-7670",
					entrezGeneId: 596,
					gene: {
						entrezGeneId: 596,
						hugoGeneSymbol: "BCL2",
						type: "protein-coding",
						cytoband: "18q21.33",
						length: 196433,
						chromosome: "18"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 26,
					tumorRefCount: 58,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 60985850,
					endPosition: 60985850,
					referenceAllele: "T",
					proteinChange: "K17M",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "L",
					fisValue: 1.24,
					linkXvar: "getma.org/?cm=var&var=hg19,18,60985850,T,A&fts=all",
					linkPdb: "getma.org/pdb.php?prot=BCL2_HUMAN&from=7&to=33&var=K17M",
					linkMsa: "getma.org/?cm=msa&ty=f&p=BCL2_HUMAN&rb=1&re=53&var=K17M",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "BCL2 K17 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "A",
					refseqMrnaId: "NA",
					proteinPosStart: 17,
					proteinPosEnd: 17
				},
				{
					uniqueSampleKey: "VENHQS02Ny0zNzc0LTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS02Ny0zNzc0Omx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-67-3774-01",
					patientId: "TCGA-67-3774",
					entrezGeneId: 596,
					gene: {
						entrezGeneId: 596,
						hugoGeneSymbol: "BCL2",
						type: "protein-coding",
						cytoband: "18q21.33",
						length: 196433,
						chromosome: "18"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 25,
					tumorRefCount: 124,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 60985890,
					endPosition: 60985890,
					referenceAllele: "C",
					proteinChange: "A4P",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "N",
					fisValue: -1.1,
					linkXvar: "getma.org/?cm=var&var=hg19,18,60985890,C,G&fts=all",
					linkPdb: "getma.org/pdb.php?prot=BCL2_HUMAN&from=1&to=6&var=A4P",
					linkMsa: "getma.org/?cm=msa&ty=f&p=BCL2_HUMAN&rb=1&re=36&var=A4P",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "BCL2 A4 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "G",
					refseqMrnaId: "NA",
					proteinPosStart: 4,
					proteinPosEnd: 4
				},
				{
					uniqueSampleKey: "VENHQS05Ny03NTU0LTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS05Ny03NTU0Omx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-97-7554-01",
					patientId: "TCGA-97-7554",
					entrezGeneId: 672,
					gene: {
						entrezGeneId: 672,
						hugoGeneSymbol: "BRCA1",
						type: "protein-coding",
						cytoband: "17q21.31",
						length: 81189,
						chromosome: "17"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 20,
					tumorRefCount: 69,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 41234512,
					endPosition: 41234513,
					referenceAllele: "CC",
					proteinChange: "G1422V",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "[Not Available]",
					fisValue: 1.4013e-45,
					linkXvar: "[Not Available]",
					linkPdb: "[Not Available]",
					linkMsa: "[Not Available]",
					ncbiBuild: "GRCh37",
					variantType: "DNP",
					keyword: "BRCA1 G1422 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "AA",
					refseqMrnaId: "NM_007294.3",
					proteinPosStart: 1422,
					proteinPosEnd: 1422
				},
				{
					uniqueSampleKey: "VENHQS0wNS00MzgyLTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS0wNS00MzgyOmx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-05-4382-01",
					patientId: "TCGA-05-4382",
					entrezGeneId: 672,
					gene: {
						entrezGeneId: 672,
						hugoGeneSymbol: "BRCA1",
						type: "protein-coding",
						cytoband: "17q21.31",
						length: 81189,
						chromosome: "17"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 10,
					tumorRefCount: 164,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 41246314,
					endPosition: 41246314,
					referenceAllele: "C",
					proteinChange: "V412L",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "M",
					fisValue: 2.18,
					linkXvar: "getma.org/?cm=var&var=hg19,17,41246314,C,A&fts=all",
					linkPdb: "NA",
					linkMsa: "getma.org/?cm=msa&ty=f&p=BRCA1_HUMAN&rb=344&re=508&var=V412L",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "BRCA1 V412 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "A",
					refseqMrnaId: "NM_007294.3",
					proteinPosStart: 412,
					proteinPosEnd: 412
				},
				{
					uniqueSampleKey: "VENHQS0wNS00NDI0LTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS0wNS00NDI0Omx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-05-4424-01",
					patientId: "TCGA-05-4424",
					entrezGeneId: 672,
					gene: {
						entrezGeneId: 672,
						hugoGeneSymbol: "BRCA1",
						type: "protein-coding",
						cytoband: "17q21.31",
						length: 81189,
						chromosome: "17"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 31,
					tumorRefCount: 83,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 41243499,
					endPosition: 41243499,
					referenceAllele: "C",
					proteinChange: "G1350A",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "N",
					fisValue: 0.205,
					linkXvar: "getma.org/?cm=var&var=hg19,17,41243499,C,G&fts=all",
					linkPdb: "NA",
					linkMsa: "getma.org/?cm=msa&ty=f&p=BRCA1_HUMAN&rb=1179&re=1368&var=G1350A",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "BRCA1 G1350 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "G",
					refseqMrnaId: "NM_007294.3",
					proteinPosStart: 1350,
					proteinPosEnd: 1350
				},
				{
					uniqueSampleKey: "VENHQS00NC0zMzk2LTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS00NC0zMzk2Omx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-44-3396-01",
					patientId: "TCGA-44-3396",
					entrezGeneId: 672,
					gene: {
						entrezGeneId: 672,
						hugoGeneSymbol: "BRCA1",
						type: "protein-coding",
						cytoband: "17q21.31",
						length: 81189,
						chromosome: "17"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 9,
					tumorRefCount: 167,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 41244550,
					endPosition: 41244550,
					referenceAllele: "C",
					proteinChange: "E1000Q",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "M",
					fisValue: 3.405,
					linkXvar: "getma.org/?cm=var&var=hg19,17,41244550,C,G&fts=all",
					linkPdb: "NA",
					linkMsa: "getma.org/?cm=msa&ty=f&p=BRCA1_HUMAN&rb=979&re=1178&var=E1000Q",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "BRCA1 E1000 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "G",
					refseqMrnaId: "NM_007294.3",
					proteinPosStart: 1000,
					proteinPosEnd: 1000
				},
				{
					uniqueSampleKey: "VENHQS01MC02NTkzLTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS01MC02NTkzOmx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-50-6593-01",
					patientId: "TCGA-50-6593",
					entrezGeneId: 672,
					gene: {
						entrezGeneId: 672,
						hugoGeneSymbol: "BRCA1",
						type: "protein-coding",
						cytoband: "17q21.31",
						length: 81189,
						chromosome: "17"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 31,
					tumorRefCount: 173,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 41251814,
					endPosition: 41251814,
					referenceAllele: "C",
					proteinChange: "K175N",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "N",
					fisValue: -1.59,
					linkXvar: "getma.org/?cm=var&var=hg19,17,41251814,C,A&fts=all",
					linkPdb: "NA",
					linkMsa: "getma.org/?cm=msa&ty=f&p=BRCA1_HUMAN&rb=65&re=264&var=K175N",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "BRCA1 K175 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "A",
					refseqMrnaId: "NM_007294.3",
					proteinPosStart: 175,
					proteinPosEnd: 175
				},
				{
					uniqueSampleKey: "VENHQS01NS02OTcyLTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS01NS02OTcyOmx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-55-6972-01",
					patientId: "TCGA-55-6972",
					entrezGeneId: 672,
					gene: {
						entrezGeneId: 672,
						hugoGeneSymbol: "BRCA1",
						type: "protein-coding",
						cytoband: "17q21.31",
						length: 81189,
						chromosome: "17"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 7,
					tumorRefCount: 63,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 41226380,
					endPosition: 41226380,
					referenceAllele: "G",
					proteinChange: "T1548M",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "N",
					fisValue: -0.255,
					linkXvar: "getma.org/?cm=var&var=hg19,17,41226380,G,A&fts=all",
					linkPdb: "NA",
					linkMsa: "getma.org/?cm=msa&ty=f&p=BRCA1_HUMAN&rb=1423&re=1622&var=T1548M",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "BRCA1 T1548 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "A",
					refseqMrnaId: "NM_007294.3",
					proteinPosStart: 1548,
					proteinPosEnd: 1548
				},
				{
					uniqueSampleKey: "VENHQS01NS03MjgxLTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS01NS03MjgxOmx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-55-7281-01",
					patientId: "TCGA-55-7281",
					entrezGeneId: 672,
					gene: {
						entrezGeneId: 672,
						hugoGeneSymbol: "BRCA1",
						type: "protein-coding",
						cytoband: "17q21.31",
						length: 81189,
						chromosome: "17"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 40,
					tumorRefCount: 242,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 41209101,
					endPosition: 41209101,
					referenceAllele: "G",
					proteinChange: "P1749S",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "L",
					fisValue: 1.04,
					linkXvar: "getma.org/?cm=var&var=hg19,17,41209101,G,A&fts=all",
					linkPdb: "getma.org/pdb.php?prot=BRCA1_HUMAN&from=1724&to=1755&var=P1749S",
					linkMsa: "getma.org/?cm=msa&ty=f&p=BRCA1_HUMAN&rb=1724&re=1755&var=P1749S",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "BRCA1 P1749 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "A",
					refseqMrnaId: "NM_007294.3",
					proteinPosStart: 1749,
					proteinPosEnd: 1749
				},
				{
					uniqueSampleKey: "VENHQS0wNS01NDI4LTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS0wNS01NDI4Omx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-05-5428-01",
					patientId: "TCGA-05-5428",
					entrezGeneId: 999,
					gene: {
						entrezGeneId: 999,
						hugoGeneSymbol: "CDH1",
						type: "protein-coding",
						cytoband: "16q22.1",
						length: 98253,
						chromosome: "16"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 35,
					tumorRefCount: 34,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 68862125,
					endPosition: 68862125,
					referenceAllele: "A",
					proteinChange: "K738R",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "M",
					fisValue: 2.61,
					linkXvar: "getma.org/?cm=var&var=hg19,16,68862125,A,G&fts=all",
					linkPdb: "NA",
					linkMsa: "getma.org/?cm=msa&ty=f&p=CADH1_HUMAN&rb=732&re=879&var=K738R",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "CDH1 K738 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "G",
					refseqMrnaId: "NM_004360.3",
					proteinPosStart: 738,
					proteinPosEnd: 738
				},
				{
					uniqueSampleKey: "VENHQS00NC0yNjU2LTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS00NC0yNjU2Omx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-44-2656-01",
					patientId: "TCGA-44-2656",
					entrezGeneId: 999,
					gene: {
						entrezGeneId: 999,
						hugoGeneSymbol: "CDH1",
						type: "protein-coding",
						cytoband: "16q22.1",
						length: 98253,
						chromosome: "16"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 47,
					tumorRefCount: 259,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 68849475,
					endPosition: 68849475,
					referenceAllele: "G",
					proteinChange: "V460L",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "L",
					fisValue: 1.645,
					linkXvar: "getma.org/?cm=var&var=hg19,16,68849475,G,T&fts=all",
					linkPdb: "getma.org/pdb.php?prot=CADH1_HUMAN&from=380&to=478&var=V460L",
					linkMsa: "getma.org/?cm=msa&ty=f&p=CADH1_HUMAN&rb=380&re=478&var=V460L",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "CDH1 V460 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "T",
					refseqMrnaId: "NM_004360.3",
					proteinPosStart: 460,
					proteinPosEnd: 460
				},
				{
					uniqueSampleKey: "VENHQS05NS03NTY3LTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS05NS03NTY3Omx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-95-7567-01",
					patientId: "TCGA-95-7567",
					entrezGeneId: 999,
					gene: {
						entrezGeneId: 999,
						hugoGeneSymbol: "CDH1",
						type: "protein-coding",
						cytoband: "16q22.1",
						length: 98253,
						chromosome: "16"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "---",
					tumorAltCount: 8,
					tumorRefCount: 82,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 68846036,
					endPosition: 68846037,
					referenceAllele: "AG",
					proteinChange: "S337Ffs*12",
					mutationType: "Splice_Site",
					functionalImpactScore: "",
					fisValue: 1.4013e-45,
					linkXvar: "",
					linkPdb: "",
					linkMsa: "",
					ncbiBuild: "GRCh37",
					variantType: "DEL",
					keyword: "CDH1 truncating",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "-",
					refseqMrnaId: "NM_004360.3",
					proteinPosStart: 337,
					proteinPosEnd: 337
				},
				{
					uniqueSampleKey: "VENHQS05Ny03NTU0LTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS05Ny03NTU0Omx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-97-7554-01",
					patientId: "TCGA-97-7554",
					entrezGeneId: 6662,
					gene: {
						entrezGeneId: 6662,
						hugoGeneSymbol: "SOX9",
						type: "protein-coding",
						cytoband: "17q24.3",
						length: 5401,
						chromosome: "17"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 4,
					tumorRefCount: 16,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 70117637,
					endPosition: 70117637,
					referenceAllele: "C",
					proteinChange: "C35*",
					mutationType: "Nonsense_Mutation",
					functionalImpactScore: "NA",
					fisValue: 0,
					linkXvar: "getma.org/?cm=var&var=hg19,17,70117637,C,A&fts=all",
					linkPdb: "NA",
					linkMsa: "NA",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "SOX9 truncating",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "A",
					refseqMrnaId: "NM_000346.3",
					proteinPosStart: 35,
					proteinPosEnd: 35
				},
				{
					uniqueSampleKey: "VENHQS01NS03NTczLTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS01NS03NTczOmx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-55-7573-01",
					patientId: "TCGA-55-7573",
					entrezGeneId: 10188,
					gene: {
						entrezGeneId: 10188,
						hugoGeneSymbol: "TNK2",
						type: "protein-coding",
						cytoband: "3q29",
						length: 45646,
						chromosome: "3"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 3,
					tumorRefCount: 30,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 195593860,
					endPosition: 195593860,
					referenceAllele: "G",
					proteinChange: "R1004W",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "L",
					fisValue: 1.3,
					linkXvar: "getma.org/?cm=var&var=hg19,3,195593860,G,A&fts=all",
					linkPdb: "NA",
					linkMsa: "getma.org/?cm=msa&ty=f&p=ACK1_HUMAN&rb=842&re=1038&var=R1004W",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "TNK2 R1004 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "A",
					refseqMrnaId: "NM_005781.4",
					proteinPosStart: 1004,
					proteinPosEnd: 1004
				},
				{
					uniqueSampleKey: "VENHQS0wNS00Mzk1LTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS0wNS00Mzk1Omx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-05-4395-01",
					patientId: "TCGA-05-4395",
					entrezGeneId: 10188,
					gene: {
						entrezGeneId: 10188,
						hugoGeneSymbol: "TNK2",
						type: "protein-coding",
						cytoband: "3q29",
						length: 45646,
						chromosome: "3"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 43,
					tumorRefCount: 12,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 195610174,
					endPosition: 195610174,
					referenceAllele: "C",
					proteinChange: "V155L",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "M",
					fisValue: 2.98,
					linkXvar: "getma.org/?cm=var&var=hg19,3,195610174,C,A&fts=all",
					linkPdb: "getma.org/pdb.php?prot=ACK1_HUMAN&from=126&to=385&var=V155L",
					linkMsa: "getma.org/?cm=msa&ty=f&p=ACK1_HUMAN&rb=126&re=385&var=V155L",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "TNK2 V155 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "A",
					refseqMrnaId: "NM_005781.4",
					proteinPosStart: 155,
					proteinPosEnd: 155
				},
				{
					uniqueSampleKey: "VENHQS03NS02MjE0LTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS03NS02MjE0Omx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-75-6214-01",
					patientId: "TCGA-75-6214",
					entrezGeneId: 10188,
					gene: {
						entrezGeneId: 10188,
						hugoGeneSymbol: "TNK2",
						type: "protein-coding",
						cytoband: "3q29",
						length: 45646,
						chromosome: "3"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 4,
					tumorRefCount: 26,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 195595457,
					endPosition: 195595457,
					referenceAllele: "G",
					proteinChange: "P556L",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "N",
					fisValue: 0.695,
					linkXvar: "getma.org/?cm=var&var=hg19,3,195595457,G,A&fts=all",
					linkPdb: "NA",
					linkMsa: "getma.org/?cm=msa&ty=f&p=ACK1_HUMAN&rb=515&re=714&var=P556L",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "TNK2 P556 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "A",
					refseqMrnaId: "NM_005781.4",
					proteinPosStart: 556,
					proteinPosEnd: 556
				},
				{
					uniqueSampleKey: "VENHQS03OC03MTU1LTAxOmx1YWRfdGNnYQ",
					uniquePatientKey: "VENHQS03OC03MTU1Omx1YWRfdGNnYQ",
					molecularProfileId: "luad_tcga_mutations",
					sampleId: "TCGA-78-7155-01",
					patientId: "TCGA-78-7155",
					entrezGeneId: 10188,
					gene: {
						entrezGeneId: 10188,
						hugoGeneSymbol: "TNK2",
						type: "protein-coding",
						cytoband: "3q29",
						length: 45646,
						chromosome: "3"
					},
					studyId: "luad_tcga",
					center: "broad.mit.edu",
					mutationStatus: "Somatic",
					validationStatus: "NA",
					tumorAltCount: 7,
					tumorRefCount: 20,
					normalAltCount: -1,
					normalRefCount: -1,
					startPosition: 195594441,
					endPosition: 195594441,
					referenceAllele: "G",
					proteinChange: "P895S",
					mutationType: "Missense_Mutation",
					functionalImpactScore: "N",
					fisValue: -0.345,
					linkXvar: "getma.org/?cm=var&var=hg19,3,195594441,G,A&fts=all",
					linkPdb: "NA",
					linkMsa: "getma.org/?cm=msa&ty=f&p=ACK1_HUMAN&rb=842&re=1038&var=P895S",
					ncbiBuild: "GRCh37",
					variantType: "SNP",
					keyword: "TNK2 P895 missense",
					driverFilter: "",
					driverFilterAnnotation: "",
					driverTiersFilter: "",
					driverTiersFilterAnnotation: "",
					variantAllele: "A",
					refseqMrnaId: "NM_005781.4",
					proteinPosStart: 895,
					proteinPosEnd: 895
				}
			] as any;
			return result;
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
									this.mutationsByGene[gene.hugoGeneSymbol]
									// () => this.mutationDataCache,
									// () => this.genomeNexusEnrichmentCache,
									// () => this.mutationCountCache
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
