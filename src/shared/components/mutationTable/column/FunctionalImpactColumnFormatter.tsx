import * as React from "react";
import { Circle } from "better-react-spinkit";
import * as classnames from "classnames";
import DefaultTooltip from "../../../../shared/components/defaultTooltip/DefaultTooltip";
import "rc-tooltip/assets/bootstrap_white.css";
import GenomeNexusCache, { GenomeNexusCacheDataType } from "../../../../shared/cache/GenomeNexusEnrichment";
import { Mutation, DiscreteCopyNumberData } from "../../../../shared/api/generated/CBioPortalAPI";
import { default as TableCellStatusIndicator, TableCellStatus } from "../../../../shared/components/TableCellStatus";
import MutationAssessor from "../../../../shared/components/annotation/genomeNexus/MutationAssessor";
import { MutationAssessor as MutationAssessorData } from "../../../../shared/api/generated/GenomeNexusAPIInternal";
import Sift from "../../../../shared/components/annotation/genomeNexus/Sift";
import PolyPhen2 from "../../../../shared/components/annotation/genomeNexus/PolyPhen2";
// import siftStyles from "../../../../shared/components/annotation/genomeNexus/styles/siftTooltip.module.scss";
// import polyPhen2Styles from "../../../../shared/components/annotation/genomeNexus/styles/polyPhen2Tooltip.module.scss";
// import mutationAssessorStyles from "../../../../shared/components/annotation/genomeNexus/styles/mutationAssessorColumn.module.scss";
import "../../../../shared/components/annotation/genomeNexus/styles/siftTooltip.module.scss";
import "../../../../shared/components/annotation/genomeNexus/styles/polyPhen2Tooltip.module.scss";
import "../../../../shared/components/annotation/genomeNexus/styles/mutationAssessorColumn.module.scss";
// import annotationStyles from "../../../../shared/components/annotation/styles/annotation.module.scss";
import "../../../../shared/components/annotation/styles/annotation.module.scss";

type FunctionalImpactColumnTooltipProps = {
	active: "mutationAssessor" | "sift" | "polyPhen2";
};

interface IFunctionalImpactColumnTooltipState {
	active: "mutationAssessor" | "sift" | "polyPhen2";
}

interface IFunctionalImpactData {
	mutationAssessor: MutationAssessorData;
	siftScore: number;
	siftPrediction: string;
	polyPhenScore: number;
	polyPhenPrediction: string;
}

class FunctionalImpactColumnTooltip extends React.Component<
	FunctionalImpactColumnTooltipProps,
	IFunctionalImpactColumnTooltipState
> {
	constructor(props: FunctionalImpactColumnTooltipProps) {
		super(props);
		this.state = {
			active: this.props.active
		};
	}
	// 图片路径错误
	legend() {
		return (
			<div>
				<table className="table table-striped table-border-top">
					<thead>
						<tr>
							<th>Legend</th>
							<th>
								<span
									style={{
										display: "inline-block",
										width: 22
									}}
									title="Mutation Asessor"
									onMouseOver={() =>
										this.setState({
											active: "mutationAssessor"
										})
									}
								>
									<img
										height={14}
										width={14}
										src={require("./mutationAssessor.png")}
										alt="Mutation Assessor"
									/>
								</span>
							</th>
							<th>
								<span
									style={{
										display: "inline-block",
										width: 22
									}}
									title="SIFT"
									onMouseOver={() => this.setState({ active: "sift" })}
								>
									<img height={14} width={14} src={require("./siftFunnel.png")} alt="SIFT" />
								</span>
							</th>
							<th>
								<span
									style={{
										display: "inline-block",
										width: 22
									}}
									title="PolyPhen-2"
									onMouseOver={() => this.setState({ active: "polyPhen2" })}
								>
									<img height={14} width={14} src={require("./polyPhen-2.png")} alt="PolyPhen-2" />
								</span>
							</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<span
									className={classnames(
										"annotation-item-text",
										"ma-high"
									)}
								>
									<i className="fa fa-circle" aria-hidden="true" />
								</span>
							</td>
							<td className={"ma-high"}>high</td>
							<td className={"sift-deleterious"}>deleterious</td>
							<td className={"polyPhen2-probably_damaging"}>probably_damaging</td>
						</tr>
						<tr>
							<td>
								<span
									className={classnames(
										"annotation-item-text",
										"ma-medium"
									)}
								>
									<i className="fa fa-circle" aria-hidden="true" />
								</span>
							</td>
							<td className={"ma-medium"}>medium</td>
							<td>-</td>
							<td>-</td>
						</tr>
						<tr>
							<td>
								<span
									className={classnames(
										"annotation-item-text",
										"ma-low"
									)}
								>
									<i className="fa fa-circle" aria-hidden="true" />
								</span>
							</td>
							<td className={"ma-low"}>low</td>
							<td className={"sift-deleterious_low_confidence"}>
								deleterious_low_confidence
							</td>
							<td className={"polyPhen2-possibly_damaging"}>possibly_damaging</td>
						</tr>
						<tr>
							<td>
								<span
									className={classnames(
										"annotation-item-text",
										"ma-neutral"
									)}
								>
									<i className="fa fa-circle" aria-hidden="true" />
								</span>
							</td>
							<td className={"ma-neutral"}>neutral</td>
							<td className={"sift-tolerated_low_confidence"}>tolerated_low_confidence</td>
							<td className={"polyPhen2-benign"}>benign</td>
						</tr>
						<tr>
							<td />
							<td>-</td>
							<td className={"sift-tolerated"}>tolerated</td>
							<td>-</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}

	public static mutationAssessorText() {
		return (
			<div style={{ width: 450, height: 100 }}>
				<a href={MutationAssessor.MUTATION_ASSESSOR_URL} target="_blank">
					Mutation Assessor
				</a>{" "}
				predicts the functional impact of amino-acid substitutions in proteins, such as mutations discovered in
				cancer or missense polymorphisms. The functional impact is assessed based on evolutionary conservation
				of the affected amino acid in protein homologs. The method has been validated on a large set (60k) of
				disease associated (OMIM) and polymorphic variants.
			</div>
		);
	}

	public static siftText() {
		return (
			<div style={{ width: 450, height: 100 }}>
				<a href={Sift.SIFT_URL} target="_blank">
					SIFT
				</a>{" "}
				predicts whether an amino acid substitution affects protein function based on sequence homology and the
				physical properties of amino acids. SIFT can be applied to naturally occurring nonsynonymous
				polymorphisms and laboratory-induced missense mutations.
			</div>
		);
	}

	public static polyPhen2Text() {
		return (
			<div style={{ width: 450, height: 100 }}>
				<a href={PolyPhen2.POLYPHEN2_URL} target="_blank">
					PolyPhen-2
				</a>{" "}
				(Polymorphism Phenotyping v2) is a tool which predicts possible impact of an amino acid substitution on
				the structure and function of a human protein using straightforward physical and comparative
				considerations.
			</div>
		);
	}

	public render() {
		return (
			<div>
				{this.state.active === "mutationAssessor" && FunctionalImpactColumnTooltip.mutationAssessorText()}
				{this.state.active === "sift" && FunctionalImpactColumnTooltip.siftText()}
				{this.state.active === "polyPhen2" && FunctionalImpactColumnTooltip.polyPhen2Text()}
				{this.legend()}
			</div>
		);
	}
}

export function placeArrow(tooltipEl: any) {
	const arrowEl = tooltipEl.querySelector(".rc-tooltip-arrow");
	arrowEl.style.left = "10px";
}

export default class FunctionalImpactColumnFormatter {
	public static headerRender(name: string) {
		const arrowContent = <div className="rc-tooltip-arrow-inner" />;
		return (
			<div>
				{name}
				<br />
				<div style={{ height: 14 }}>
					<DefaultTooltip
						overlay={<FunctionalImpactColumnTooltip active="mutationAssessor" />}
						placement="topLeft"
						trigger={["hover", "focus"]}
						arrowContent={arrowContent}
						destroyTooltipOnHide={true}
						onPopupAlign={placeArrow}
					>
						<span style={{ display: "inline-block", width: 22 }}>
							<img
								height={14}
								width={14}
								src={require("./mutationAssessor.png")}
								className={'mutation-assessor-main-img'}
								alt="Sift"
							/>
						</span>
					</DefaultTooltip>
					<DefaultTooltip
						overlay={<FunctionalImpactColumnTooltip active="sift" />}
						placement="topLeft"
						trigger={["hover", "focus"]}
						arrowContent={arrowContent}
						destroyTooltipOnHide={true}
						onPopupAlign={placeArrow}
					>
						<span style={{ display: "inline-block", width: 22 }}>
							<img
								height={14}
								width={14}
								src={require("./siftFunnel.png")}
								className={'mutation-assessor-main-img'}
								alt="SIFT"
							/>
						</span>
					</DefaultTooltip>
					<DefaultTooltip
						overlay={<FunctionalImpactColumnTooltip active="polyPhen2" />}
						placement="topLeft"
						trigger={["hover", "focus"]}
						arrowContent={arrowContent}
						destroyTooltipOnHide={true}
						onPopupAlign={placeArrow}
					>
						<span style={{ display: "inline-block", width: 22 }}>
							<img
								height={14}
								width={14}
								src={require("./polyPhen-2.png")}
								className={'mutation-assessor-main-img'}
								alt="PolyPhen-2"
							/>
						</span>
					</DefaultTooltip>
				</div>
			</div>
		);
	}

	public static getData(genomeNexusData: GenomeNexusCacheDataType | null): IFunctionalImpactData | null {
		if (genomeNexusData === null || genomeNexusData.status === "error" || genomeNexusData.data === null) {
			return null;
		}

		//  TODO: handle multiple transcripts instead of just picking the first one
		const mutationAssessor =
			genomeNexusData.data.mutation_assessor && genomeNexusData.data.mutation_assessor.annotation;
		const siftScore = parseFloat(genomeNexusData.data.transcript_consequences[0].sift_score);
		const siftPrediction = genomeNexusData.data.transcript_consequences[0].sift_prediction;
		const polyPhenScore = parseFloat(genomeNexusData.data.transcript_consequences[0].polyphen_score);
		const polyPhenPrediction = genomeNexusData.data.transcript_consequences[0].polyphen_prediction;

		return {
			mutationAssessor,
			siftScore,
			siftPrediction,
			polyPhenScore,
			polyPhenPrediction
		};
	}

	public static renderFunction(data: Mutation[], genomeNexusCache: GenomeNexusCache) {
		const genomeNexusData = FunctionalImpactColumnFormatter.getGenomeNexusData(data, genomeNexusCache);
		return <div>{FunctionalImpactColumnFormatter.makeFuncionalImpactViz(genomeNexusData)}</div>;
	}

	public static download(data: Mutation[], genomeNexusCache: GenomeNexusCache): string {
		const genomeNexusData = FunctionalImpactColumnFormatter.getGenomeNexusData(data, genomeNexusCache);
		const functionalImpactData = FunctionalImpactColumnFormatter.getData(genomeNexusData);

		if (!functionalImpactData) {
			return "";
		}

		return [
			`MutationAssessor: ${MutationAssessor.download(functionalImpactData.mutationAssessor)}`,
			`SIFT: ${Sift.download(functionalImpactData.siftScore, functionalImpactData.siftPrediction)}`,
			`Polyphen-2: ${PolyPhen2.download(
				functionalImpactData.polyPhenScore,
				functionalImpactData.polyPhenPrediction
			)}`
		].join(";");
	}

	private static getGenomeNexusData(data: Mutation[], cache: GenomeNexusCache): GenomeNexusCacheDataType | null {
		if (data.length === 0) {
			return null;
		}
		return cache.get(data[0]);
	}

	private static makeFuncionalImpactViz(genomeNexusData: GenomeNexusCacheDataType | null) {
		let status: TableCellStatus | null = null;

		if (genomeNexusData === null) {
			status = TableCellStatus.LOADING;
		} else if (genomeNexusData.status === "error") {
			status = TableCellStatus.ERROR;
		} else if (genomeNexusData.data === null) {
			status = TableCellStatus.NA;
		} else {
			const functionalImpactData = FunctionalImpactColumnFormatter.getData(genomeNexusData);

			return (
				functionalImpactData && (
					<div>
						<MutationAssessor mutationAssessor={functionalImpactData.mutationAssessor} />
						<Sift
							siftScore={functionalImpactData.siftScore}
							siftPrediction={functionalImpactData.siftPrediction}
						/>
						<PolyPhen2
							polyPhenScore={functionalImpactData.polyPhenScore}
							polyPhenPrediction={functionalImpactData.polyPhenPrediction}
						/>
					</div>
				)
			);
		}

		if (status !== null) {
			//  show loading circle
			if (status === TableCellStatus.LOADING) {
				return <Circle size={18} scaleEnd={0.5} scaleStart={0.2} color="#aaa" className="pull-left" />;
			} else {
				return <TableCellStatusIndicator status={status} />;
			}
		}
	}
}
