import * as request from "superagent";

type CallbackHandler = (err: any, res?: request.Response) => void;
export type EnsemblFilter = {
	geneIds: Array<string>;

	proteinIds: Array<string>;

	transcriptIds: Array<string>;
};
export type EnsemblTranscript = {
	transcriptId: string;

	geneId: string;

	proteinId: string;

	proteinLength: number;

	pfamDomains: Array<PfamDomainRange>;
};
export type GeneXref = {
	db_display_name: string;

	dbname: string;

	description: string;

	display_id: string;

	info_text: string;

	info_types: string;

	primary_id: string;

	synonyms: Array<string>;

	version: string;
};
export type PdbHeader = {
	compound: {};

	pdbId: string;

	source: {};

	title: string;
};
export type PfamDomain = {
	description: string;

	name: string;

	pfamAccession: string;
};
export type PfamDomainRange = {
	pfamDomainId: string;

	pfamDomainStart: number;

	pfamDomainEnd: number;
};
export type TranscriptConsequence = {
	amino_acids: string;

	canonical: string;

	codons: string;

	consequence_terms: Array<string>;

	gene_id: string;

	gene_symbol: string;

	hgnc_id: string;

	hgvsc: string;

	hgvsp: string;

	polyphen_prediction: string;

	polyphen_score: string;

	protein_end: string;

	protein_id: string;

	protein_start: string;

	refseq_transcript_ids: Array<string>;

	sift_prediction: string;

	sift_score: string;

	transcript_id: string;

	variant_allele: string;
};
export type VariantAnnotation = {
	allele_string: string;

	annotationJSON: string;

	assembly_name: string;

	end: number;

	id: string;

	most_severe_consequence: string;

	seq_region_name: string;

	start: number;

	strand: number;

	transcript_consequences: Array<TranscriptConsequence>;

	variant: string;
};
export type Version = {
	version: string;
};

/**
 * Genome Nexus Variant Annotation API
 * @class GenomeNexusAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class GenomeNexusAPI {
	private domain: string = "";
	private errorHandlers: CallbackHandler[] = [];

	constructor(domain?: string) {
		if (domain) {
			this.domain = domain;
		}
	}

	getDomain() {
		return this.domain;
	}

	addErrorHandler(handler: CallbackHandler) {
		this.errorHandlers.push(handler);
	}

	private request(
		method: string,
		url: string,
		body: any,
		headers: any,
		queryParameters: any,
		form: any,
		reject: CallbackHandler,
		resolve: CallbackHandler,
		errorHandlers: CallbackHandler[]
	) {
		let req = (new (request as any).Request(
			method,
			url
		) as request.Request).query(queryParameters);
		Object.keys(headers).forEach(key => {
			req.set(key, headers[key]);
		});

		if (body) {
			req.send(body);
		}

		if (typeof body === "object" && !(body.constructor.name === "Buffer")) {
			req.set("Content-Type", "application/json");
		}

		if (Object.keys(form).length > 0) {
			req.type("form");
			req.send(form);
		}
		console.log('--url--', url)
		req.end((error, response) => {
			if (error || !response.ok) {
				reject(error);
				errorHandlers.forEach(handler => handler(error));
			} else {
				resolve(response);
			}
		});
	}

	fetchVariantAnnotationPOSTURL(parameters: {
		variants: Array<string>;
		isoformOverrideSource?: string;
		fields?: Array<string>;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/annotation";

		if (parameters["isoformOverrideSource"] !== undefined) {
			queryParameters["isoformOverrideSource"] =
				parameters["isoformOverrideSource"];
		}

		if (parameters["fields"] !== undefined) {
			queryParameters["fields"] = parameters["fields"];
		}

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves VEP annotation for the provided list of variants
	 * @method
	 * @name GenomeNexusAPI#fetchVariantAnnotationPOST
	 * @param {} variants - List of variants. For example ["X:g.66937331T>A","17:g.41242962_41242963insGA"]
	 * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
	 * @param {array} fields - Comma separated list of fields to include (case-sensitive!). For example: hotspots,mutation_assessor
	 */
	fetchVariantAnnotationPOST(parameters: {
		variants: Array<string>;
		isoformOverrideSource?: string;
		fields?: Array<string>;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<Array<VariantAnnotation>> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/annotation";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			if (parameters["variants"] !== undefined) {
				body = parameters["variants"];
			}

			if (parameters["variants"] === undefined) {
				reject(new Error("Missing required  parameter: variants"));
				return;
			}

			if (parameters["isoformOverrideSource"] !== undefined) {
				queryParameters["isoformOverrideSource"] =
					parameters["isoformOverrideSource"];
			}

			if (parameters["fields"] !== undefined) {
				queryParameters["fields"] = parameters["fields"];
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"POST",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchVariantAnnotationGETURL(parameters: {
		variant: string;
		isoformOverrideSource?: string;
		fields?: Array<string>;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/annotation/{variant}";

		path = path.replace("{variant}", parameters["variant"] + "");
		if (parameters["isoformOverrideSource"] !== undefined) {
			queryParameters["isoformOverrideSource"] =
				parameters["isoformOverrideSource"];
		}

		if (parameters["fields"] !== undefined) {
			queryParameters["fields"] = parameters["fields"];
		}

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves VEP annotation for the provided variant
	 * @method
	 * @name GenomeNexusAPI#fetchVariantAnnotationGET
	 * @param {string} variant - Variant. For example 17:g.41242962_41242963insGA
	 * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
	 * @param {array} fields - Comma separated list of fields to include (case-sensitive!). For example: hotspots,mutation_assessor
	 */
	fetchVariantAnnotationGET(parameters: {
		variant: string;
		isoformOverrideSource?: string;
		fields?: Array<string>;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<VariantAnnotation> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/annotation/{variant}";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			path = path.replace("{variant}", parameters["variant"] + "");

			if (parameters["variant"] === undefined) {
				reject(new Error("Missing required  parameter: variant"));
				return;
			}

			if (parameters["isoformOverrideSource"] !== undefined) {
				queryParameters["isoformOverrideSource"] =
					parameters["isoformOverrideSource"];
			}

			if (parameters["fields"] !== undefined) {
				queryParameters["fields"] = parameters["fields"];
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"GET",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOSTURL(parameters: {
		hugoSymbols: Array<string>;
		isoformOverrideSource?: string;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/ensembl/canonical-transcript/hgnc";

		if (parameters["isoformOverrideSource"] !== undefined) {
			queryParameters["isoformOverrideSource"] =
				parameters["isoformOverrideSource"];
		}

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves Ensembl canonical transcripts by Hugo Symbols
	 * @method
	 * @name GenomeNexusAPI#fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOST
	 * @param {} hugoSymbols - List of Hugo Symbols. For example ["TP53","PIK3CA","BRCA1"]
	 * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
	 */
	fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOST(parameters: {
		hugoSymbols: Array<string>;
		isoformOverrideSource?: string;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<Array<EnsemblTranscript>> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/ensembl/canonical-transcript/hgnc";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			if (parameters["hugoSymbols"] !== undefined) {
				body = parameters["hugoSymbols"];
			}

			if (parameters["hugoSymbols"] === undefined) {
				reject(new Error("Missing required  parameter: hugoSymbols"));
				return;
			}

			if (parameters["isoformOverrideSource"] !== undefined) {
				queryParameters["isoformOverrideSource"] =
					parameters["isoformOverrideSource"];
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"POST",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchCanonicalEnsemblTranscriptByHugoSymbolGETURL(parameters: {
		hugoSymbol: string;
		isoformOverrideSource?: string;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/ensembl/canonical-transcript/hgnc/{hugoSymbol}";

		path = path.replace("{hugoSymbol}", parameters["hugoSymbol"] + "");
		if (parameters["isoformOverrideSource"] !== undefined) {
			queryParameters["isoformOverrideSource"] =
				parameters["isoformOverrideSource"];
		}

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves Ensembl canonical transcript by Hugo Symbol
	 * @method
	 * @name GenomeNexusAPI#fetchCanonicalEnsemblTranscriptByHugoSymbolGET
	 * @param {string} hugoSymbol - A Hugo Symbol. For example TP53
	 * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
	 */
	fetchCanonicalEnsemblTranscriptByHugoSymbolGET(parameters: {
		hugoSymbol: string;
		isoformOverrideSource?: string;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<EnsemblTranscript> {
		console.log('---test---')
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/ensembl/canonical-transcript/hgnc/{hugoSymbol}";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			path = path.replace("{hugoSymbol}", parameters["hugoSymbol"] + "");

			if (parameters["hugoSymbol"] === undefined) {
				reject(new Error("Missing required  parameter: hugoSymbol"));
				return;
			}

			if (parameters["isoformOverrideSource"] !== undefined) {
				queryParameters["isoformOverrideSource"] =
					parameters["isoformOverrideSource"];
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"GET",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchEnsemblTranscriptsGETURL(parameters: {
		geneId?: string;
		proteinId?: string;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/ensembl/transcript";
		if (parameters["geneId"] !== undefined) {
			queryParameters["geneId"] = parameters["geneId"];
		}

		if (parameters["proteinId"] !== undefined) {
			queryParameters["proteinId"] = parameters["proteinId"];
		}

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves Ensembl Transcripts by protein ID, and gene ID. Retrieves all transcripts in case no query parameter provided
	 * @method
	 * @name GenomeNexusAPI#fetchEnsemblTranscriptsGET
	 * @param {string} geneId - An Ensembl gene ID. For example ENSG00000136999
	 * @param {string} proteinId - An Ensembl protein ID. For example ENSP00000439985
	 */
	fetchEnsemblTranscriptsGET(parameters: {
		geneId?: string;
		proteinId?: string;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<Array<EnsemblTranscript>> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/ensembl/transcript";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			if (parameters["geneId"] !== undefined) {
				queryParameters["geneId"] = parameters["geneId"];
			}

			if (parameters["proteinId"] !== undefined) {
				queryParameters["proteinId"] = parameters["proteinId"];
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"GET",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchEnsemblTranscriptsByEnsemblFilterPOSTURL(parameters: {
		ensemblFilter: EnsemblFilter;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/ensembl/transcript";

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves Ensembl Transcripts by Ensembl transcript IDs, protein IDs, or gene IDs
	 * @method
	 * @name GenomeNexusAPI#fetchEnsemblTranscriptsByEnsemblFilterPOST
	 * @param {} ensemblFilter - List of Ensembl transcript IDs. For example ["ENST00000361390", "ENST00000361453", "ENST00000361624"]<br>OR<br>List of Ensembl protein IDs. For example ["ENSP00000439985", "ENSP00000478460", "ENSP00000346196"]<br>OR<br>List of Ensembl gene IDs. For example ["ENSG00000136999", "ENSG00000272398", "ENSG00000198695"]
	 */
	fetchEnsemblTranscriptsByEnsemblFilterPOST(parameters: {
		ensemblFilter: EnsemblFilter;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<Array<EnsemblTranscript>> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/ensembl/transcript";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			if (parameters["ensemblFilter"] !== undefined) {
				body = parameters["ensemblFilter"];
			}

			if (parameters["ensemblFilter"] === undefined) {
				reject(new Error("Missing required  parameter: ensemblFilter"));
				return;
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"POST",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchEnsemblTranscriptByTranscriptIdGETURL(parameters: {
		transcriptId: string;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/ensembl/transcript/{transcriptId}";

		path = path.replace("{transcriptId}", parameters["transcriptId"] + "");

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves the transcript by an Ensembl transcript ID
	 * @method
	 * @name GenomeNexusAPI#fetchEnsemblTranscriptByTranscriptIdGET
	 * @param {string} transcriptId - An Ensembl transcript ID. For example ENST00000361390
	 */
	fetchEnsemblTranscriptByTranscriptIdGET(parameters: {
		transcriptId: string;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<EnsemblTranscript> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/ensembl/transcript/{transcriptId}";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			path = path.replace(
				"{transcriptId}",
				parameters["transcriptId"] + ""
			);

			if (parameters["transcriptId"] === undefined) {
				reject(new Error("Missing required  parameter: transcriptId"));
				return;
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"GET",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchGeneXrefsGETURL(parameters: {
		accession: string;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/ensembl/xrefs";
		if (parameters["accession"] !== undefined) {
			queryParameters["accession"] = parameters["accession"];
		}

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Perform lookups of Ensembl identifiers and retrieve their external references in other databases
	 * @method
	 * @name GenomeNexusAPI#fetchGeneXrefsGET
	 * @param {string} accession - Ensembl gene accession. For example ENSG00000169083
	 */
	fetchGeneXrefsGET(parameters: {
		accession: string;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<Array<GeneXref>> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/ensembl/xrefs";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			if (parameters["accession"] !== undefined) {
				queryParameters["accession"] = parameters["accession"];
			}

			if (parameters["accession"] === undefined) {
				reject(new Error("Missing required  parameter: accession"));
				return;
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"GET",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchPdbHeaderPOSTURL(parameters: {
		pdbIds: Array<string>;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/pdb/header";

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves PDB header info by a PDB id
	 * @method
	 * @name GenomeNexusAPI#fetchPdbHeaderPOST
	 * @param {} pdbIds - List of pdb ids, for example ["1a37","1a4o"]
	 */
	fetchPdbHeaderPOST(parameters: {
		pdbIds: Array<string>;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<Array<PdbHeader>> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/pdb/header";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			if (parameters["pdbIds"] !== undefined) {
				body = parameters["pdbIds"];
			}

			if (parameters["pdbIds"] === undefined) {
				reject(new Error("Missing required  parameter: pdbIds"));
				return;
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"POST",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchPdbHeaderGETURL(parameters: {
		pdbId: string;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/pdb/header/{pdbId}";

		path = path.replace("{pdbId}", parameters["pdbId"] + "");

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves PDB header info by a PDB id
	 * @method
	 * @name GenomeNexusAPI#fetchPdbHeaderGET
	 * @param {string} pdbId - PDB id, for example 1a37
	 */
	fetchPdbHeaderGET(parameters: {
		pdbId: string;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<PdbHeader> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/pdb/header/{pdbId}";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			path = path.replace("{pdbId}", parameters["pdbId"] + "");

			if (parameters["pdbId"] === undefined) {
				reject(new Error("Missing required  parameter: pdbId"));
				return;
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"GET",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchPfamDomainsGETURL(parameters: { $queryParameters?: any }): string {
		let queryParameters: any = {};
		let path = "/pfam/domain";

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves all PFAM domains
	 * @method
	 * @name GenomeNexusAPI#fetchPfamDomainsGET
	 */
	fetchPfamDomainsGET(parameters: {
		$queryParameters?: any;
		$domain?: string;
	}): Promise<Array<PfamDomain>> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/pfam/domain";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"GET",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchPfamDomainsByPfamAccessionPOSTURL(parameters: {
		pfamAccessions: Array<string>;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/pfam/domain";

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves PFAM domains by PFAM domain accession IDs
	 * @method
	 * @name GenomeNexusAPI#fetchPfamDomainsByPfamAccessionPOST
	 * @param {} pfamAccessions - List of PFAM domain accession IDs. For example ["PF02827","PF00093","PF15276"]
	 */
	fetchPfamDomainsByPfamAccessionPOST(parameters: {
		pfamAccessions: Array<string>;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<Array<PfamDomain>> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/pfam/domain";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			if (parameters["pfamAccessions"] !== undefined) {
				body = parameters["pfamAccessions"];
			}

			if (parameters["pfamAccessions"] === undefined) {
				reject(
					new Error("Missing required  parameter: pfamAccessions")
				);
				return;
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}
			console.log('request', domain, path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers)
			request(
				"POST",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchPfamDomainsByAccessionGETURL(parameters: {
		pfamAccession: string;
		$queryParameters?: any;
	}): string {
		let queryParameters: any = {};
		let path = "/pfam/domain/{pfamAccession}";

		path = path.replace(
			"{pfamAccession}",
			parameters["pfamAccession"] + ""
		);

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieves a PFAM domain by a PFAM domain ID
	 * @method
	 * @name GenomeNexusAPI#fetchPfamDomainsByAccessionGET
	 * @param {string} pfamAccession - A PFAM domain accession ID. For example PF02827
	 */
	fetchPfamDomainsByAccessionGET(parameters: {
		pfamAccession: string;
		$queryParameters?: any;
		$domain?: string;
	}): Promise<PfamDomain> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/pfam/domain/{pfamAccession}";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			path = path.replace(
				"{pfamAccession}",
				parameters["pfamAccession"] + ""
			);

			if (parameters["pfamAccession"] === undefined) {
				reject(new Error("Missing required  parameter: pfamAccession"));
				return;
			}

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"GET",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}

	fetchVersionGETURL(parameters: { $queryParameters?: any }): string {
		let queryParameters: any = {};
		let path = "/version";

		if (parameters.$queryParameters) {
			Object.keys(parameters.$queryParameters).forEach(function(
				parameterName
			) {
				var parameter = parameters.$queryParameters[parameterName];
				queryParameters[parameterName] = parameter;
			});
		}
		let keys = Object.keys(queryParameters);
		return (
			this.domain +
			path +
			(keys.length > 0
				? "?" +
					keys
						.map(
							key =>
								key +
								"=" +
								encodeURIComponent(queryParameters[key])
						)
						.join("&")
				: "")
		);
	}

	/**
	 * Retrieve Genome Nexus Version
	 * @method
	 * @name GenomeNexusAPI#fetchVersionGET
	 */
	fetchVersionGET(parameters: {
		$queryParameters?: any;
		$domain?: string;
	}): Promise<Version> {
		const domain = parameters.$domain ? parameters.$domain : this.domain;
		const errorHandlers = this.errorHandlers;
		const request = this.request;
		let path = "/version";
		let body: any;
		let queryParameters: any = {};
		let headers: any = {};
		let form: any = {};
		return new Promise(function(resolve, reject) {
			headers["Accept"] = "application/json";
			headers["Content-Type"] = "application/json";

			if (parameters.$queryParameters) {
				Object.keys(parameters.$queryParameters).forEach(function(
					parameterName
				) {
					var parameter = parameters.$queryParameters[parameterName];
					queryParameters[parameterName] = parameter;
				});
			}

			request(
				"GET",
				domain + path,
				body,
				headers,
				queryParameters,
				form,
				reject,
				resolve,
				errorHandlers
			);
		}).then(function(response: request.Response) {
			return response.body;
		});
	}
}
