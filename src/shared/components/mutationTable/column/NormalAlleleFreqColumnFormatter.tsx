import * as React from "react";
import { Mutation } from "../../../../shared/api/generated/CBioPortalAPI";
import TableCellStatusIndicator from "../../../../shared/components/TableCellStatus";
import { TableCellStatus } from "../../../../shared/components/TableCellStatus";
import TumorAlleleFreqColumnFormatter from "./TumorAlleleFreqColumnFormatter";

export default class NormalAlleleFreqColumnFormatter {
	public static renderFunction(mutations: Mutation[]) {
		const frequency = NormalAlleleFreqColumnFormatter.getSortValue(mutations);

		if (frequency) {
			const altReads = mutations[0].normalAltCount;
			const refReads = mutations[0].normalRefCount;

			return TumorAlleleFreqColumnFormatter.mainContent(frequency, altReads, refReads);
		} else {
			return <TableCellStatusIndicator status={TableCellStatus.NA} />;
		}
	}

	public static getSortValue(mutations: Mutation[]) {
		const mutation = mutations[0];

		if (!mutation) {
			return null;
		}

		const altReads = mutation.normalAltCount;
		const refReads = mutation.normalRefCount;

		if (altReads < 0 || refReads < 0) {
			return null;
		}

		return altReads / (altReads + refReads);
	}
}
