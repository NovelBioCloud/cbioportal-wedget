import { IAppConfig } from "./IAppConfig";
import * as _ from "lodash";

export const AppConfig: IAppConfig = {
	apiRoot: 'www.cbioportal.org/beta',
	enableDarwin: false,
	appVersion: "20180129-1123",
	maxTreeDepth: 3,
	showOncoKB: true,
	oncoKBApiUrl: "oncokb.org/api/v1",
	genomeNexusApiUrl: "https://genomenexus.cbioportal.review/",
	showCivic: true,
	showHotspot: true,
	showMyCancerGenome: true,
	showGenomeNexus: true,
	querySetsOfGenes: JSON.parse("null"),
	skinBlurb:
		'The cBioPortal for Cancer Genomics provides <b>visualization</b>, <b>analysis</b> and <b>download</b> of large-scale <b>cancer genomics</b> data sets. <p><b>Please cite</b> <a href="http://www.ncbi.nlm.nih.gov/pubmed/23550210">Gao et al. <i>Sci. Signal.</i> 2013</a> &amp;  <a href="http://cancerdiscovery.aacrjournals.org/content/2/5/401.abstract"> Cerami et al. <i>Cancer Discov.</i> 2012</a> when publishing results based on cBioPortal.</p>',
	skinExampleStudyQueries: 'tcga provisional\ntcga -provisional\ntcga OR icgc\n-"cell line"\nprostate mskcc\nesophageal OR stomach\nserous\nbreast'.split(
		"\n"
	),
	skinDatasetHeader:
		"The portal currently contains data from <NUM_CANCER_STUDIES> cancer genomics studies.  The table below lists the number of available samples per cancer study and data type.",
	skinDatasetFooter:
		'Data sets of published studies were curated from literature. Data sets of provisional TCGA studies were downloaded from the <a href="http://gdac.broadinstitute.org">Broad Institute Firehose</a> and updated quarterly.',
	skinRightNavShowDatasets: true,
	skinRightNavShowExamples: true,
	skinRightNavShowTestimonials: true,
	skinRightNavExamplesHTML: "",
	skinRightNavWhatsNewBlurb: "",
	userEmailAddress: "anonymousUser",
	oncoprintCustomDriverAnnotationBinaryMenuLabel: "null",
	oncoprintCustomDriverAnnotationTiersMenuLabel: "null",
	oncoprintCustomDriverAnnotationDefault: "false" !== "false", // true unless "false"
	oncoprintCustomDriverTiersAnnotationDefault: "false" !== "false", // true unless "false"
	oncoprintOncoKbHotspotsDefault: { true: undefined, false: "disable", custom: "custom" }["true"],
	oncoprintHideVUSDefault: false, // false unless "true"
	priorityStudies: {}
} as any;
/**
 *
 *
 */
export const updateConfig = () => {
	const windowSelf: any = window;
	var isVirtualStudy = false;
	var cancerStudyIdList = "null"; // empty string if single study
	var cancerStudyId = "luad_tcga"; // if multi-studies, this is always "all"
	windowSelf.cohortIdsList = cancerStudyIdList === "null" ? [cancerStudyId] : cancerStudyIdList.split(",");
	windowSelf.isVirtualStudy = false; // true if: vc or multi-studies
	/** ===================== */
	function jspToJs(val, processFn = x => x) {
		if (val === "null") {
			return undefined;
		} else {
			return processFn(val);
		}
	}

	var molecularProfilesString = "luad_tcga_gistic luad_tcga_rna_seq_v2_mrna_median_Zscores luad_tcga_mutations".trim();
	var molecularProfiles: string[] = [];
	if (molecularProfilesString.length) {
		molecularProfiles = molecularProfilesString.split(/\s+/);
	} else {
		molecularProfiles = undefined;
	}

	var oql_html_conversion_vessel = document.createElement("div");
	// oql_html_conversion_vessel.innerHTML = "BRCA1 SOX9 TNK2 CDH1 BCL2".trim();
	var html_decoded_oql = oql_html_conversion_vessel.textContent.trim();
	var uri_and_html_decoded_oql = decodeURIComponent(html_decoded_oql);

	windowSelf.serverVars = {
		molecularProfiles: molecularProfiles,
		caseSetProperties: {
			case_set_id: jspToJs("luad_tcga_rna_seq_v2_mrna"),
			case_ids_key: jspToJs("6db70721bacbdd6e0d211aa8f15dbda3"),
			case_set_name: jspToJs("Tumor Samples with mRNA data (RNA Seq V2)"),
			case_set_description: jspToJs("All samples with mRNA expression data (517 samples)")
		},

		zScoreThreshold: jspToJs("2.0", parseFloat),
		rppaScoreThreshold: jspToJs("2.0", parseFloat),
		dataPriority: jspToJs("0", function(d) {
			return parseInt(d, 10);
		}),

		theQuery: decodeURIComponent(jspToJs(uri_and_html_decoded_oql) || ""),
		studySampleObj: jspToJs(
			'{"luad_tcga":["TCGA-05-4384-01","TCGA-05-4390-01","TCGA-05-4425-01","TCGA-38-4631-01","TCGA-38-4632-01","TCGA-38-6178-01","TCGA-44-6145-01","TCGA-44-6146-01","TCGA-44-6147-01","TCGA-44-6148-01","TCGA-49-4488-01","TCGA-50-5930-01","TCGA-50-5931-01","TCGA-50-5932-01","TCGA-50-5933-01","TCGA-50-5935-01","TCGA-50-5941-01","TCGA-50-5942-01","TCGA-50-5944-01","TCGA-50-5946-01","TCGA-50-6591-01","TCGA-50-6592-01","TCGA-50-6593-01","TCGA-50-6594-01","TCGA-55-6543-01","TCGA-67-4679-01","TCGA-67-6215-01","TCGA-67-6216-01","TCGA-67-6217-01","TCGA-73-4658-01","TCGA-73-4676-01","TCGA-75-5122-01","TCGA-75-5125-01","TCGA-75-5126-01","TCGA-75-6203-01","TCGA-75-6205-01","TCGA-75-6206-01","TCGA-75-6207-01","TCGA-75-6211-01","TCGA-75-6212-01","TCGA-86-6562-01","TCGA-05-4396-01","TCGA-05-4405-01","TCGA-05-4410-01","TCGA-05-4415-01","TCGA-05-4417-01","TCGA-05-4424-01","TCGA-05-4427-01","TCGA-05-4433-01","TCGA-44-6774-01","TCGA-44-6775-01","TCGA-44-6776-01","TCGA-44-6777-01","TCGA-44-6778-01","TCGA-44-6779-01","TCGA-49-4487-01","TCGA-49-4490-01","TCGA-49-4512-01","TCGA-49-4514-01","TCGA-49-6742-01","TCGA-49-6743-01","TCGA-49-6744-01","TCGA-49-6745-01","TCGA-49-6767-01","TCGA-50-5044-01","TCGA-50-5051-01","TCGA-50-5072-01","TCGA-50-6590-01","TCGA-50-6595-01","TCGA-50-6597-01","TCGA-55-6642-01","TCGA-55-6712-01","TCGA-71-6725-01","TCGA-91-6828-01","TCGA-91-6829-01","TCGA-91-6831-01","TCGA-91-6835-01","TCGA-91-6836-01","TCGA-49-6761-01","TCGA-50-6673-01","TCGA-55-6968-01","TCGA-55-6969-01","TCGA-55-6970-01","TCGA-55-6971-01","TCGA-55-6972-01","TCGA-55-6975-01","TCGA-55-6978-01","TCGA-55-6979-01","TCGA-55-6980-01","TCGA-55-6981-01","TCGA-55-6982-01","TCGA-55-6983-01","TCGA-55-6984-01","TCGA-55-6985-01","TCGA-55-6986-01","TCGA-55-6987-01","TCGA-75-6214-01","TCGA-75-7025-01","TCGA-75-7027-01","TCGA-75-7030-01","TCGA-75-7031-01","TCGA-80-5607-01","TCGA-80-5608-01","TCGA-86-6851-01","TCGA-91-6830-01","TCGA-91-6840-01","TCGA-91-6847-01","TCGA-91-6848-01","TCGA-91-6849-01","TCGA-95-7039-01","TCGA-95-7043-01","TCGA-38-7271-01","TCGA-44-5644-01","TCGA-50-7109-01","TCGA-55-7227-01","TCGA-55-7281-01","TCGA-55-7283-01","TCGA-55-7570-01","TCGA-55-7573-01","TCGA-55-7574-01","TCGA-78-7143-01","TCGA-78-7145-01","TCGA-78-7146-01","TCGA-78-7147-01","TCGA-78-7148-01","TCGA-78-7149-01","TCGA-78-7150-01","TCGA-78-7152-01","TCGA-78-7153-01","TCGA-78-7154-01","TCGA-78-7155-01","TCGA-78-7156-01","TCGA-78-7158-01","TCGA-78-7159-01","TCGA-78-7160-01","TCGA-78-7161-01","TCGA-78-7220-01","TCGA-93-7348-01","TCGA-97-7546-01","TCGA-97-7547-01","TCGA-97-7552-01","TCGA-97-7553-01","TCGA-97-7554-01","TCGA-99-7458-01","TCGA-44-7659-01","TCGA-44-7660-01","TCGA-44-7661-01","TCGA-44-7662-01","TCGA-44-7667-01","TCGA-44-7669-01","TCGA-44-7670-01","TCGA-44-7671-01","TCGA-44-7672-01","TCGA-53-7624-01","TCGA-53-7626-01","TCGA-55-7576-01","TCGA-64-1679-01","TCGA-64-1681-01","TCGA-78-7162-01","TCGA-78-7163-01","TCGA-78-7166-01","TCGA-78-7167-01","TCGA-78-7535-01","TCGA-78-7536-01","TCGA-78-7537-01","TCGA-78-7539-01","TCGA-78-7540-01","TCGA-78-7542-01","TCGA-78-7633-01","TCGA-86-7711-01","TCGA-86-7713-01","TCGA-95-7567-01","TCGA-53-7813-01","TCGA-55-7724-01","TCGA-55-7725-01","TCGA-55-7726-01","TCGA-55-7727-01","TCGA-55-7815-01","TCGA-55-7816-01","TCGA-55-7903-01","TCGA-55-7907-01","TCGA-55-7910-01","TCGA-55-7911-01","TCGA-55-7914-01","TCGA-69-7760-01","TCGA-69-7761-01","TCGA-69-7763-01","TCGA-69-7764-01","TCGA-69-7765-01","TCGA-86-7701-01","TCGA-86-7714-01","TCGA-91-7771-01","TCGA-97-7937-01","TCGA-97-7938-01","TCGA-55-7728-01","TCGA-55-7994-01","TCGA-55-7995-01","TCGA-69-7973-01","TCGA-69-7974-01","TCGA-69-7978-01","TCGA-69-7979-01","TCGA-69-7980-01","TCGA-73-7498-01","TCGA-73-7499-01","TCGA-86-7953-01","TCGA-86-7954-01","TCGA-86-7955-01","TCGA-93-7347-01","TCGA-95-7944-01","TCGA-95-7947-01","TCGA-95-7948-01","TCGA-97-7941-01","TCGA-44-8117-01","TCGA-44-8119-01","TCGA-44-8120-01","TCGA-55-7284-01","TCGA-55-7913-01","TCGA-55-8085-01","TCGA-55-8087-01","TCGA-55-8089-01","TCGA-55-8090-01","TCGA-55-8091-01","TCGA-55-8092-01","TCGA-55-8094-01","TCGA-55-8096-01","TCGA-55-8097-01","TCGA-55-8203-01","TCGA-55-8204-01","TCGA-55-8205-01","TCGA-55-8206-01","TCGA-55-8207-01","TCGA-55-8208-01","TCGA-86-8054-01","TCGA-86-8055-01","TCGA-86-8056-01","TCGA-86-8073-01","TCGA-86-8074-01","TCGA-86-8075-01","TCGA-86-8076-01","TCGA-95-7562-01","TCGA-95-8039-01","TCGA-99-8025-01","TCGA-99-8028-01","TCGA-99-8032-01","TCGA-99-8033-01","TCGA-J2-8192-01","TCGA-J2-8194-01","TCGA-55-8299-01","TCGA-55-8301-01","TCGA-69-8253-01","TCGA-69-8254-01","TCGA-69-8255-01","TCGA-86-8278-01","TCGA-86-8279-01","TCGA-86-8280-01","TCGA-86-8281-01","TCGA-93-8067-01","TCGA-97-8171-01","TCGA-97-8172-01","TCGA-97-8174-01","TCGA-97-8175-01","TCGA-97-8177-01","TCGA-97-8179-01","TCGA-50-8457-01","TCGA-50-8459-01","TCGA-50-8460-01","TCGA-55-8302-01","TCGA-62-8394-01","TCGA-62-8395-01","TCGA-62-8397-01","TCGA-62-8398-01","TCGA-62-8399-01","TCGA-62-8402-01","TCGA-69-8453-01","TCGA-86-8358-01","TCGA-86-8359-01","TCGA-95-8494-01","TCGA-55-8505-01","TCGA-55-8506-01","TCGA-55-8507-01","TCGA-55-8508-01","TCGA-55-8510-01","TCGA-55-8511-01","TCGA-55-8512-01","TCGA-55-8513-01","TCGA-55-8514-01","TCGA-55-8614-01","TCGA-55-8615-01","TCGA-55-8616-01","TCGA-55-8619-01","TCGA-55-8620-01","TCGA-55-8621-01","TCGA-71-8520-01","TCGA-78-8640-01","TCGA-78-8648-01","TCGA-78-8655-01","TCGA-78-8660-01","TCGA-78-8662-01","TCGA-86-8585-01","TCGA-86-8668-01","TCGA-86-8669-01","TCGA-86-8671-01","TCGA-86-8672-01","TCGA-86-8673-01","TCGA-86-8674-01","TCGA-91-8496-01","TCGA-91-8497-01","TCGA-91-8499-01","TCGA-97-8176-01","TCGA-97-8547-01","TCGA-97-8552-01","TCGA-38-A44F-01","TCGA-44-A479-01","TCGA-44-A47A-01","TCGA-44-A47B-01","TCGA-44-A47G-01","TCGA-55-A48X-01","TCGA-55-A48Y-01","TCGA-55-A490-01","TCGA-55-A491-01","TCGA-55-A492-01","TCGA-55-A493-01","TCGA-55-A4DF-01","TCGA-55-A4DG-01","TCGA-62-A46O-01","TCGA-62-A46P-01","TCGA-62-A46R-01","TCGA-62-A46S-01","TCGA-62-A46U-01","TCGA-62-A46V-01","TCGA-62-A46Y-01","TCGA-62-A470-01","TCGA-62-A471-01","TCGA-62-A472-01","TCGA-86-A456-01","TCGA-86-A4D0-01","TCGA-91-A4BC-01","TCGA-91-A4BD-01","TCGA-J2-A4AD-01","TCGA-J2-A4AE-01","TCGA-J2-A4AG-01","TCGA-L4-A4E6-01","TCGA-L9-A443-01","TCGA-L9-A444-01","TCGA-44-A4SS-01","TCGA-44-A4SU-01","TCGA-53-A4EZ-01","TCGA-55-A48Z-01","TCGA-55-A494-01","TCGA-86-A4JF-01","TCGA-86-A4P7-01","TCGA-86-A4P8-01","TCGA-93-A4JN-01","TCGA-93-A4JO-01","TCGA-93-A4JP-01","TCGA-93-A4JQ-01","TCGA-97-A4LX-01","TCGA-97-A4M0-01","TCGA-97-A4M1-01","TCGA-97-A4M2-01","TCGA-97-A4M3-01","TCGA-97-A4M5-01","TCGA-97-A4M6-01","TCGA-97-A4M7-01","TCGA-L4-A4E5-01","TCGA-MN-A4N1-01","TCGA-MN-A4N4-01","TCGA-MN-A4N5-01","TCGA-MP-A4SV-01","TCGA-MP-A4SW-01","TCGA-MP-A4SY-01","TCGA-MP-A4T7-01","TCGA-MP-A4T8-01","TCGA-MP-A4T9-01","TCGA-MP-A4TA-01","TCGA-MP-A4TC-01","TCGA-MP-A4TI-01","TCGA-MP-A4TK-01","TCGA-69-A59K-01","TCGA-95-A4VK-01","TCGA-95-A4VN-01","TCGA-95-A4VP-01","TCGA-MP-A4T4-01","TCGA-MP-A4T6-01","TCGA-MP-A4TD-01","TCGA-MP-A4TE-01","TCGA-MP-A4TF-01","TCGA-MP-A4TH-01","TCGA-MP-A4TJ-01","TCGA-MP-A5C7-01","TCGA-NJ-A4YF-01","TCGA-NJ-A4YG-01","TCGA-NJ-A4YI-01","TCGA-NJ-A4YP-01","TCGA-NJ-A4YQ-01","TCGA-NJ-A55A-01","TCGA-NJ-A55O-01","TCGA-NJ-A55R-01","TCGA-O1-A52J-01","TCGA-35-3615-01","TCGA-44-2655-01","TCGA-44-2656-01","TCGA-44-2659-01","TCGA-44-2662-01","TCGA-44-2665-01","TCGA-44-2666-01","TCGA-44-2668-01","TCGA-55-1592-01","TCGA-55-1594-01","TCGA-55-1595-01","TCGA-55-1596-01","TCGA-64-1676-01","TCGA-64-1677-01","TCGA-64-1678-01","TCGA-64-1680-01","TCGA-67-3770-01","TCGA-67-3771-01","TCGA-67-3772-01","TCGA-67-3773-01","TCGA-67-3774-01","TCGA-49-AAQV-01","TCGA-49-AAR0-01","TCGA-49-AAR2-01","TCGA-4B-A93V-01","TCGA-55-A57B-01","TCGA-99-AA5R-01","TCGA-L9-A50W-01","TCGA-L9-A5IP-01","TCGA-L9-A743-01","TCGA-L9-A7SV-01","TCGA-L9-A8F4-01","TCGA-NJ-A7XG-01","TCGA-S2-AA1A-01","TCGA-49-AAR3-01","TCGA-49-AAR4-01","TCGA-49-AAR9-01","TCGA-49-AARE-01","TCGA-49-AARN-01","TCGA-49-AARO-01","TCGA-49-AARQ-01","TCGA-49-AARR-01","TCGA-73-A9RS-01","TCGA-05-4244-01","TCGA-05-4249-01","TCGA-05-4250-01","TCGA-35-4122-01","TCGA-35-4123-01","TCGA-44-2657-01","TCGA-44-2661-01","TCGA-44-3398-01","TCGA-44-3918-01","TCGA-44-3919-01","TCGA-44-4112-01","TCGA-05-4382-01","TCGA-05-4389-01","TCGA-05-4395-01","TCGA-05-4397-01","TCGA-05-4398-01","TCGA-05-4402-01","TCGA-05-4403-01","TCGA-05-4418-01","TCGA-05-4420-01","TCGA-05-4422-01","TCGA-05-4426-01","TCGA-05-4430-01","TCGA-05-4432-01","TCGA-05-4434-01","TCGA-38-4625-01","TCGA-38-4626-01","TCGA-38-4627-01","TCGA-38-4628-01","TCGA-38-4629-01","TCGA-38-4630-01","TCGA-44-3396-01","TCGA-49-4486-01","TCGA-49-4494-01","TCGA-49-4501-01","TCGA-49-4505-01","TCGA-49-4506-01","TCGA-49-4507-01","TCGA-49-4510-01","TCGA-73-4659-01","TCGA-73-4662-01","TCGA-73-4666-01","TCGA-73-4668-01","TCGA-73-4670-01","TCGA-73-4675-01","TCGA-73-4677-01","TCGA-05-5420-01","TCGA-05-5423-01","TCGA-05-5425-01","TCGA-05-5428-01","TCGA-05-5429-01","TCGA-05-5715-01","TCGA-35-5375-01","TCGA-44-5643-01","TCGA-44-5645-01","TCGA-50-5045-01","TCGA-50-5049-01","TCGA-50-5055-01","TCGA-50-5066-01","TCGA-50-5068-01","TCGA-50-5936-01","TCGA-50-5939-01","TCGA-55-5899-01","TCGA-64-5774-01","TCGA-64-5775-01","TCGA-64-5778-01","TCGA-64-5779-01","TCGA-64-5781-01","TCGA-64-5815-01","TCGA-75-5146-01","TCGA-75-5147-01","TCGA-80-5611-01","TCGA-83-5908-01","TCGA-50-5066-02","TCGA-50-5946-02"]}',
			JSON.parse
		)
	};
	/** ================= */
	// yes "null" will be string
	if (windowSelf.cancerStudyIdList && windowSelf.cancerStudyIdList !== "null") {
		windowSelf.serverVars.cohortIdsList = cancerStudyIdList.split(",");
	} else if (windowSelf.cancerStudyId) {
		windowSelf.serverVars.cohortIdsList = [cancerStudyId];
	}

	if (windowSelf.serverVars.studySampleObj) {
		windowSelf.serverVars.studySampleListMap = (function() {
			var ret = {};
			ret[Object.keys(windowSelf.serverVars.studySampleObj)[0]] =
				windowSelf.serverVars.caseSetProperties.case_set_id;
			return ret;
		})();
		windowSelf.serverVars.cancerStudies = Object.keys(windowSelf.serverVars.studySampleObj);
	}
	/** ===================== */
	var patientSampleIdMap = {};
	windowSelf.PortalGlobals = {
		setPatientSampleIdMap: function(_patientSampleIdMap) {
			patientSampleIdMap = _patientSampleIdMap;
		}
	};

	function setUpQuerySession() {
		var studySampleObj = JSON.parse(
			'{"luad_tcga":["TCGA-05-4384-01","TCGA-05-4390-01","TCGA-05-4425-01","TCGA-38-4631-01","TCGA-38-4632-01","TCGA-38-6178-01","TCGA-44-6145-01","TCGA-44-6146-01","TCGA-44-6147-01","TCGA-44-6148-01","TCGA-49-4488-01","TCGA-50-5930-01","TCGA-50-5931-01","TCGA-50-5932-01","TCGA-50-5933-01","TCGA-50-5935-01","TCGA-50-5941-01","TCGA-50-5942-01","TCGA-50-5944-01","TCGA-50-5946-01","TCGA-50-6591-01","TCGA-50-6592-01","TCGA-50-6593-01","TCGA-50-6594-01","TCGA-55-6543-01","TCGA-67-4679-01","TCGA-67-6215-01","TCGA-67-6216-01","TCGA-67-6217-01","TCGA-73-4658-01","TCGA-73-4676-01","TCGA-75-5122-01","TCGA-75-5125-01","TCGA-75-5126-01","TCGA-75-6203-01","TCGA-75-6205-01","TCGA-75-6206-01","TCGA-75-6207-01","TCGA-75-6211-01","TCGA-75-6212-01","TCGA-86-6562-01","TCGA-05-4396-01","TCGA-05-4405-01","TCGA-05-4410-01","TCGA-05-4415-01","TCGA-05-4417-01","TCGA-05-4424-01","TCGA-05-4427-01","TCGA-05-4433-01","TCGA-44-6774-01","TCGA-44-6775-01","TCGA-44-6776-01","TCGA-44-6777-01","TCGA-44-6778-01","TCGA-44-6779-01","TCGA-49-4487-01","TCGA-49-4490-01","TCGA-49-4512-01","TCGA-49-4514-01","TCGA-49-6742-01","TCGA-49-6743-01","TCGA-49-6744-01","TCGA-49-6745-01","TCGA-49-6767-01","TCGA-50-5044-01","TCGA-50-5051-01","TCGA-50-5072-01","TCGA-50-6590-01","TCGA-50-6595-01","TCGA-50-6597-01","TCGA-55-6642-01","TCGA-55-6712-01","TCGA-71-6725-01","TCGA-91-6828-01","TCGA-91-6829-01","TCGA-91-6831-01","TCGA-91-6835-01","TCGA-91-6836-01","TCGA-49-6761-01","TCGA-50-6673-01","TCGA-55-6968-01","TCGA-55-6969-01","TCGA-55-6970-01","TCGA-55-6971-01","TCGA-55-6972-01","TCGA-55-6975-01","TCGA-55-6978-01","TCGA-55-6979-01","TCGA-55-6980-01","TCGA-55-6981-01","TCGA-55-6982-01","TCGA-55-6983-01","TCGA-55-6984-01","TCGA-55-6985-01","TCGA-55-6986-01","TCGA-55-6987-01","TCGA-75-6214-01","TCGA-75-7025-01","TCGA-75-7027-01","TCGA-75-7030-01","TCGA-75-7031-01","TCGA-80-5607-01","TCGA-80-5608-01","TCGA-86-6851-01","TCGA-91-6830-01","TCGA-91-6840-01","TCGA-91-6847-01","TCGA-91-6848-01","TCGA-91-6849-01","TCGA-95-7039-01","TCGA-95-7043-01","TCGA-38-7271-01","TCGA-44-5644-01","TCGA-50-7109-01","TCGA-55-7227-01","TCGA-55-7281-01","TCGA-55-7283-01","TCGA-55-7570-01","TCGA-55-7573-01","TCGA-55-7574-01","TCGA-78-7143-01","TCGA-78-7145-01","TCGA-78-7146-01","TCGA-78-7147-01","TCGA-78-7148-01","TCGA-78-7149-01","TCGA-78-7150-01","TCGA-78-7152-01","TCGA-78-7153-01","TCGA-78-7154-01","TCGA-78-7155-01","TCGA-78-7156-01","TCGA-78-7158-01","TCGA-78-7159-01","TCGA-78-7160-01","TCGA-78-7161-01","TCGA-78-7220-01","TCGA-93-7348-01","TCGA-97-7546-01","TCGA-97-7547-01","TCGA-97-7552-01","TCGA-97-7553-01","TCGA-97-7554-01","TCGA-99-7458-01","TCGA-44-7659-01","TCGA-44-7660-01","TCGA-44-7661-01","TCGA-44-7662-01","TCGA-44-7667-01","TCGA-44-7669-01","TCGA-44-7670-01","TCGA-44-7671-01","TCGA-44-7672-01","TCGA-53-7624-01","TCGA-53-7626-01","TCGA-55-7576-01","TCGA-64-1679-01","TCGA-64-1681-01","TCGA-78-7162-01","TCGA-78-7163-01","TCGA-78-7166-01","TCGA-78-7167-01","TCGA-78-7535-01","TCGA-78-7536-01","TCGA-78-7537-01","TCGA-78-7539-01","TCGA-78-7540-01","TCGA-78-7542-01","TCGA-78-7633-01","TCGA-86-7711-01","TCGA-86-7713-01","TCGA-95-7567-01","TCGA-53-7813-01","TCGA-55-7724-01","TCGA-55-7725-01","TCGA-55-7726-01","TCGA-55-7727-01","TCGA-55-7815-01","TCGA-55-7816-01","TCGA-55-7903-01","TCGA-55-7907-01","TCGA-55-7910-01","TCGA-55-7911-01","TCGA-55-7914-01","TCGA-69-7760-01","TCGA-69-7761-01","TCGA-69-7763-01","TCGA-69-7764-01","TCGA-69-7765-01","TCGA-86-7701-01","TCGA-86-7714-01","TCGA-91-7771-01","TCGA-97-7937-01","TCGA-97-7938-01","TCGA-55-7728-01","TCGA-55-7994-01","TCGA-55-7995-01","TCGA-69-7973-01","TCGA-69-7974-01","TCGA-69-7978-01","TCGA-69-7979-01","TCGA-69-7980-01","TCGA-73-7498-01","TCGA-73-7499-01","TCGA-86-7953-01","TCGA-86-7954-01","TCGA-86-7955-01","TCGA-93-7347-01","TCGA-95-7944-01","TCGA-95-7947-01","TCGA-95-7948-01","TCGA-97-7941-01","TCGA-44-8117-01","TCGA-44-8119-01","TCGA-44-8120-01","TCGA-55-7284-01","TCGA-55-7913-01","TCGA-55-8085-01","TCGA-55-8087-01","TCGA-55-8089-01","TCGA-55-8090-01","TCGA-55-8091-01","TCGA-55-8092-01","TCGA-55-8094-01","TCGA-55-8096-01","TCGA-55-8097-01","TCGA-55-8203-01","TCGA-55-8204-01","TCGA-55-8205-01","TCGA-55-8206-01","TCGA-55-8207-01","TCGA-55-8208-01","TCGA-86-8054-01","TCGA-86-8055-01","TCGA-86-8056-01","TCGA-86-8073-01","TCGA-86-8074-01","TCGA-86-8075-01","TCGA-86-8076-01","TCGA-95-7562-01","TCGA-95-8039-01","TCGA-99-8025-01","TCGA-99-8028-01","TCGA-99-8032-01","TCGA-99-8033-01","TCGA-J2-8192-01","TCGA-J2-8194-01","TCGA-55-8299-01","TCGA-55-8301-01","TCGA-69-8253-01","TCGA-69-8254-01","TCGA-69-8255-01","TCGA-86-8278-01","TCGA-86-8279-01","TCGA-86-8280-01","TCGA-86-8281-01","TCGA-93-8067-01","TCGA-97-8171-01","TCGA-97-8172-01","TCGA-97-8174-01","TCGA-97-8175-01","TCGA-97-8177-01","TCGA-97-8179-01","TCGA-50-8457-01","TCGA-50-8459-01","TCGA-50-8460-01","TCGA-55-8302-01","TCGA-62-8394-01","TCGA-62-8395-01","TCGA-62-8397-01","TCGA-62-8398-01","TCGA-62-8399-01","TCGA-62-8402-01","TCGA-69-8453-01","TCGA-86-8358-01","TCGA-86-8359-01","TCGA-95-8494-01","TCGA-55-8505-01","TCGA-55-8506-01","TCGA-55-8507-01","TCGA-55-8508-01","TCGA-55-8510-01","TCGA-55-8511-01","TCGA-55-8512-01","TCGA-55-8513-01","TCGA-55-8514-01","TCGA-55-8614-01","TCGA-55-8615-01","TCGA-55-8616-01","TCGA-55-8619-01","TCGA-55-8620-01","TCGA-55-8621-01","TCGA-71-8520-01","TCGA-78-8640-01","TCGA-78-8648-01","TCGA-78-8655-01","TCGA-78-8660-01","TCGA-78-8662-01","TCGA-86-8585-01","TCGA-86-8668-01","TCGA-86-8669-01","TCGA-86-8671-01","TCGA-86-8672-01","TCGA-86-8673-01","TCGA-86-8674-01","TCGA-91-8496-01","TCGA-91-8497-01","TCGA-91-8499-01","TCGA-97-8176-01","TCGA-97-8547-01","TCGA-97-8552-01","TCGA-38-A44F-01","TCGA-44-A479-01","TCGA-44-A47A-01","TCGA-44-A47B-01","TCGA-44-A47G-01","TCGA-55-A48X-01","TCGA-55-A48Y-01","TCGA-55-A490-01","TCGA-55-A491-01","TCGA-55-A492-01","TCGA-55-A493-01","TCGA-55-A4DF-01","TCGA-55-A4DG-01","TCGA-62-A46O-01","TCGA-62-A46P-01","TCGA-62-A46R-01","TCGA-62-A46S-01","TCGA-62-A46U-01","TCGA-62-A46V-01","TCGA-62-A46Y-01","TCGA-62-A470-01","TCGA-62-A471-01","TCGA-62-A472-01","TCGA-86-A456-01","TCGA-86-A4D0-01","TCGA-91-A4BC-01","TCGA-91-A4BD-01","TCGA-J2-A4AD-01","TCGA-J2-A4AE-01","TCGA-J2-A4AG-01","TCGA-L4-A4E6-01","TCGA-L9-A443-01","TCGA-L9-A444-01","TCGA-44-A4SS-01","TCGA-44-A4SU-01","TCGA-53-A4EZ-01","TCGA-55-A48Z-01","TCGA-55-A494-01","TCGA-86-A4JF-01","TCGA-86-A4P7-01","TCGA-86-A4P8-01","TCGA-93-A4JN-01","TCGA-93-A4JO-01","TCGA-93-A4JP-01","TCGA-93-A4JQ-01","TCGA-97-A4LX-01","TCGA-97-A4M0-01","TCGA-97-A4M1-01","TCGA-97-A4M2-01","TCGA-97-A4M3-01","TCGA-97-A4M5-01","TCGA-97-A4M6-01","TCGA-97-A4M7-01","TCGA-L4-A4E5-01","TCGA-MN-A4N1-01","TCGA-MN-A4N4-01","TCGA-MN-A4N5-01","TCGA-MP-A4SV-01","TCGA-MP-A4SW-01","TCGA-MP-A4SY-01","TCGA-MP-A4T7-01","TCGA-MP-A4T8-01","TCGA-MP-A4T9-01","TCGA-MP-A4TA-01","TCGA-MP-A4TC-01","TCGA-MP-A4TI-01","TCGA-MP-A4TK-01","TCGA-69-A59K-01","TCGA-95-A4VK-01","TCGA-95-A4VN-01","TCGA-95-A4VP-01","TCGA-MP-A4T4-01","TCGA-MP-A4T6-01","TCGA-MP-A4TD-01","TCGA-MP-A4TE-01","TCGA-MP-A4TF-01","TCGA-MP-A4TH-01","TCGA-MP-A4TJ-01","TCGA-MP-A5C7-01","TCGA-NJ-A4YF-01","TCGA-NJ-A4YG-01","TCGA-NJ-A4YI-01","TCGA-NJ-A4YP-01","TCGA-NJ-A4YQ-01","TCGA-NJ-A55A-01","TCGA-NJ-A55O-01","TCGA-NJ-A55R-01","TCGA-O1-A52J-01","TCGA-35-3615-01","TCGA-44-2655-01","TCGA-44-2656-01","TCGA-44-2659-01","TCGA-44-2662-01","TCGA-44-2665-01","TCGA-44-2666-01","TCGA-44-2668-01","TCGA-55-1592-01","TCGA-55-1594-01","TCGA-55-1595-01","TCGA-55-1596-01","TCGA-64-1676-01","TCGA-64-1677-01","TCGA-64-1678-01","TCGA-64-1680-01","TCGA-67-3770-01","TCGA-67-3771-01","TCGA-67-3772-01","TCGA-67-3773-01","TCGA-67-3774-01","TCGA-49-AAQV-01","TCGA-49-AAR0-01","TCGA-49-AAR2-01","TCGA-4B-A93V-01","TCGA-55-A57B-01","TCGA-99-AA5R-01","TCGA-L9-A50W-01","TCGA-L9-A5IP-01","TCGA-L9-A743-01","TCGA-L9-A7SV-01","TCGA-L9-A8F4-01","TCGA-NJ-A7XG-01","TCGA-S2-AA1A-01","TCGA-49-AAR3-01","TCGA-49-AAR4-01","TCGA-49-AAR9-01","TCGA-49-AARE-01","TCGA-49-AARN-01","TCGA-49-AARO-01","TCGA-49-AARQ-01","TCGA-49-AARR-01","TCGA-73-A9RS-01","TCGA-05-4244-01","TCGA-05-4249-01","TCGA-05-4250-01","TCGA-35-4122-01","TCGA-35-4123-01","TCGA-44-2657-01","TCGA-44-2661-01","TCGA-44-3398-01","TCGA-44-3918-01","TCGA-44-3919-01","TCGA-44-4112-01","TCGA-05-4382-01","TCGA-05-4389-01","TCGA-05-4395-01","TCGA-05-4397-01","TCGA-05-4398-01","TCGA-05-4402-01","TCGA-05-4403-01","TCGA-05-4418-01","TCGA-05-4420-01","TCGA-05-4422-01","TCGA-05-4426-01","TCGA-05-4430-01","TCGA-05-4432-01","TCGA-05-4434-01","TCGA-38-4625-01","TCGA-38-4626-01","TCGA-38-4627-01","TCGA-38-4628-01","TCGA-38-4629-01","TCGA-38-4630-01","TCGA-44-3396-01","TCGA-49-4486-01","TCGA-49-4494-01","TCGA-49-4501-01","TCGA-49-4505-01","TCGA-49-4506-01","TCGA-49-4507-01","TCGA-49-4510-01","TCGA-73-4659-01","TCGA-73-4662-01","TCGA-73-4666-01","TCGA-73-4668-01","TCGA-73-4670-01","TCGA-73-4675-01","TCGA-73-4677-01","TCGA-05-5420-01","TCGA-05-5423-01","TCGA-05-5425-01","TCGA-05-5428-01","TCGA-05-5429-01","TCGA-05-5715-01","TCGA-35-5375-01","TCGA-44-5643-01","TCGA-44-5645-01","TCGA-50-5045-01","TCGA-50-5049-01","TCGA-50-5055-01","TCGA-50-5066-01","TCGA-50-5068-01","TCGA-50-5936-01","TCGA-50-5939-01","TCGA-55-5899-01","TCGA-64-5774-01","TCGA-64-5775-01","TCGA-64-5778-01","TCGA-64-5779-01","TCGA-64-5781-01","TCGA-64-5815-01","TCGA-75-5146-01","TCGA-75-5147-01","TCGA-80-5611-01","TCGA-83-5908-01","TCGA-50-5066-02","TCGA-50-5946-02"]}'
		);
		var studyIdsList = Object.keys(studySampleObj);
		windowSelf.QuerySession = windowSelf.initDatamanager(
			"luad_tcga_gistic luad_tcga_rna_seq_v2_mrna_median_Zscores luad_tcga_mutations".trim().split(/\s+/),
			windowSelf.serverVars.theQuery,
			studyIdsList,
			studySampleObj,
			parseFloat("2.0"),
			parseFloat("2.0"),
			{
				case_set_id: "luad_tcga_rna_seq_v2_mrna",
				case_ids_key: "6db70721bacbdd6e0d211aa8f15dbda3",
				case_set_name: "Tumor Samples with mRNA data (RNA Seq V2)",
				case_set_description: "All samples with mRNA expression data (517 samples)"
			},
			false,
			false,
			false,
			0,
			"true",
			false,
			false,
			false
		);
	}

	var QuerySession_initialized = false;
	var fireQuerySession = function() {
		if (QuerySession_initialized === false) {
			setUpQuerySession();
			QuerySession_initialized = true;
		}
	};
	/** ===================== */
	windowSelf.legacySupportFrontendConfig = {
		enableDarwin: false,
		appVersion: "20180129-1123",
		maxTreeDepth: 3,
		showOncoKB: true,
		oncoKBApiUrl: "oncokb.org/api/v1",
		genomeNexusApiUrl: "https://genomenexus.cbioportal.review/",
		showCivic: true,
		showHotspot: true,
		showMyCancerGenome: true,
		showGenomeNexus: true,
		querySetsOfGenes: JSON.parse("null"),
		skinBlurb:
			'The cBioPortal for Cancer Genomics provides <b>visualization</b>, <b>analysis</b> and <b>download</b> of large-scale <b>cancer genomics</b> data sets. <p><b>Please cite</b> <a href="http://www.ncbi.nlm.nih.gov/pubmed/23550210">Gao et al. <i>Sci. Signal.</i> 2013</a> &amp;  <a href="http://cancerdiscovery.aacrjournals.org/content/2/5/401.abstract"> Cerami et al. <i>Cancer Discov.</i> 2012</a> when publishing results based on cBioPortal.</p>',
		skinExampleStudyQueries: 'tcga provisional\ntcga -provisional\ntcga OR icgc\n-"cell line"\nprostate mskcc\nesophageal OR stomach\nserous\nbreast'.split(
			"\n"
		),
		skinDatasetHeader:
			"The portal currently contains data from <NUM_CANCER_STUDIES> cancer genomics studies.  The table below lists the number of available samples per cancer study and data type.",
		skinDatasetFooter:
			'Data sets of published studies were curated from literature. Data sets of provisional TCGA studies were downloaded from the <a href="http://gdac.broadinstitute.org">Broad Institute Firehose</a> and updated quarterly.',
		skinRightNavShowDatasets: true,
		skinRightNavShowExamples: true,
		skinRightNavShowTestimonials: true,
		skinRightNavExamplesHTML: "",
		skinRightNavWhatsNewBlurb: "",
		userEmailAddress: "anonymousUser",
		oncoprintCustomDriverAnnotationBinaryMenuLabel: "null",
		oncoprintCustomDriverAnnotationTiersMenuLabel: "null",
		oncoprintCustomDriverAnnotationDefault: "false" !== "false", // true unless "false"
		oncoprintCustomDriverTiersAnnotationDefault: "false" !== "false", // true unless "false"
		oncoprintOncoKbHotspotsDefault: { true: undefined, false: "disable", custom: "custom" }["true"],
		oncoprintHideVUSDefault: false, // false unless "true"
		priorityStudies: {}
	};

	// this prevents react router from messing with hash in a way that could is unecessary (static pages)
	// or could conflict
	// Prioritized studies for study selector
	windowSelf.legacySupportFrontendConfig.priorityStudies["PanCancer Studies"] = [
		"msk_impact_2017",
		"nsclc_tcga_broad_2016"
	];
	windowSelf.legacySupportFrontendConfig.priorityStudies["Cell lines"] = ["cellline_ccle_broad", "cellline_nci60"];

	windowSelf.frontendConfig = windowSelf.frontendConfig || null;
	if (windowSelf.frontendConfig) {
		// for (var prop in windowSelf.legacySupportFrontendConfig) {
		// 	// use old property if none is defined in frontendConfig
		// 	if (!windowSelf.frontendConfig.hasOwnProperty(prop)) {
		// 		windowSelf.frontendConfig[prop] = windowSelf.legacySupportFrontendConfig[prop];
		// 	}
		// }
	} else {
		windowSelf.frontendConfig = windowSelf.legacySupportFrontendConfig;
	}
	// clean userEmailAddress config
	// if (!windowSelf.frontendConfig.userEmailAddress || windowSelf.frontendConfig.userEmailAddress === "anonymousUser") {
	// 	windowSelf.frontendConfig.userEmailAddress = "";
	// }

	// frontend config that can't be changed by deployer
	// (windowSelf.frontendConfig.frontendUrl =
	// 	"https://cbioportal.mskcc.org/frontend/3ff4b8e1c6b1a5f8966d666e3c18f1e14302ab72/"),
	// 	(windowSelf.frontendConfig.apiRoot = "www.cbioportal.org");
	// windowSelf.frontendConfig.historyType = "memory"; // default, override on per page bases, set to hash if full react page
	Object.assign(AppConfig, windowSelf.frontendConfig);
};
