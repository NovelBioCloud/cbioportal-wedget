import { Gene } from "./shared/api/generated/CBioPortalAPI";

export class Client {
	async getGene(geneName: string): Promise<Gene> {
		return {
			chromosome: "chromosome",
			cytoband: "cytoband",
			entrezGeneId: 0,
			hugoGeneSymbol: geneName,
			length: 0,
			type: "type"
		};
	}
}
export const client: Client = new Client();
