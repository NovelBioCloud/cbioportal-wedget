import * as React from "react";
import DefaultTooltip from "../../../../shared/components/defaultTooltip/DefaultTooltip";
// import annotationStyles from "./../styles/annotation.module.scss";
import "./../styles/annotation.module.scss";
// import classNames from "classnames";
import * as classnames from "classnames";
// import tooltipStyles from "./styles/mutationAssessorTooltip.module.scss";
import "./styles/mutationAssessorTooltip.module.scss";
import { MutationAssessor as MutationAssessorData } from "../../../../shared/api/generated/GenomeNexusAPIInternal";
// import mutationAssessorColumn from "./styles/mutationAssessorColumn.module.scss";
import "./styles/mutationAssessorColumn.module.scss";

export interface IMutationAssessorProps {
	mutationAssessor: MutationAssessorData;
}

export function hideArrow(tooltipEl: any) {
	const arrowEl = tooltipEl.querySelector(".rc-tooltip-arrow");
	arrowEl.style.display = "none";
}

export default class MutationAssessor extends React.Component<IMutationAssessorProps, {}> {
	static MUTATION_ASSESSOR_URL: string = "http://mutationassessor.org/r3/";

	constructor(props: IMutationAssessorProps) {
		super(props);

		this.tooltipContent = this.tooltipContent.bind(this);
	}

	public static download(mutationAssessorData: MutationAssessorData | undefined): string {
		if (mutationAssessorData) {
			return `impact: ${mutationAssessorData.functionalImpact}, score: ${
				mutationAssessorData.functionalImpactScore
			}`;
		} else {
			return "Error";
		}
	}

	public render() {
		let maContent: JSX.Element = <span className={`${"annotation-item-text"}`} />;

		if (this.props.mutationAssessor && this.props.mutationAssessor.functionalImpact !== null) {
			const maData = this.props.mutationAssessor;
			maContent = (
				<span
					className={classnames(
						"annotation-item-text",
						`ma-${maData.functionalImpact}`
					)}
				>
					<i className="fa fa-circle" aria-hidden="true" />
				</span>
			);
			const arrowContent = <div className="rc-tooltip-arrow-inner" />;
			maContent = (
				<DefaultTooltip
					overlay={this.tooltipContent}
					placement="right"
					trigger={["hover", "focus"]}
					arrowContent={arrowContent}
					onPopupAlign={hideArrow}
					destroyTooltipOnHide={false}
				>
					{maContent}
				</DefaultTooltip>
			);
		}

		return maContent;
	}

	private tooltipContent() {
		const maData = this.props.mutationAssessor;
		const xVarLink = MutationAssessor.maLink(
			`http://mutationassessor.org/r3/?cm=var&p=${maData.uniprotId}&var=${maData.variant}`
		);
		const msaLink = MutationAssessor.maLink(maData.msaLink);
		const pdbLink = MutationAssessor.maLink(maData.pdbLink);

		const impact = maData.functionalImpact ? (
			<div>
				<table className={"ma-tooltip-table"}>
					<tr>
						<td>Source</td>
						<td>
							<a href="http://mutationassessor.org/r3">MutationAssessor</a>
						</td>
					</tr>
					<tr>
						<td>Impact</td>
						<td>
							<span className={`ma-${maData.functionalImpact}`}>
								{maData.functionalImpact}
							</span>
						</td>
					</tr>
					{(maData.functionalImpactScore || maData.functionalImpactScore === 0) && (
						<tr>
							<td>Score</td>
							<td>
								<b>{maData.functionalImpactScore.toFixed(2)}</b>
							</td>
						</tr>
					)}
				</table>
			</div>
		) : null;

		const xVar = xVarLink ? (
			<div className={"mutation-assessor-link"}>
				<a href={xVarLink} target="_blank">
					<img
						height="15"
						width="19"
						src={require("./../../mutationTable/column/mutationAssessor.png")}
						className={"mutation-assessor-main-img"}
						alt="Mutation Assessor"
					/>
					Go to Mutation Assessor
				</a>
			</div>
		) : null;

		const msa = msaLink ? (
			<div className={"mutation-assessor-link"}>
				<a href={msaLink} target="_blank">
					<span className={`${"ma-icon"} ${"ma-msa-icon"}`}>msa</span>
					Multiple Sequence Alignment
				</a>
			</div>
		) : null;

		const pdb = pdbLink ? (
			<div className={"mutation-assessor-link"}>
				<a href={pdbLink} target="_blank">
					<span className={`${"ma-icon"} ${"ma-3d-icon"}`}>3D</span>
					Mutation Assessor 3D View
				</a>
			</div>
		) : null;

		return (
			<span>
				{impact}
				{msa}
				{pdb}
				{xVar}
			</span>
		);
	}

	//  This is mostly to make the legacy MA links work
	public static maLink(link: string | undefined) {
		let url = null;

		//  ignore invalid links ("", "NA", "Not Available")
		if (link) {
			//  getma.org is the legacy link, need to replace it with the actual value
			url = link.replace("getma.org", "mutationassessor.org/r3");

			//  prepend "http://" if needed
			if (url.indexOf("http://") !== 0) {
				url = `http://${url}`;
			}
		}

		return url;
	}
}
