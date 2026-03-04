import "../RulesModal/RulesModal.css";
import saveFileLevel2 from "../assets/saveFileLevel2.json";
import saveFileLevel3 from "../assets/saveFileLevel3.json";

const SolnModal = (props: {
	possibleMatrix: number[][] | null;
	closeFunction: (arg0: boolean) => void;
	level: number;
	trueMatrix: number[][];
}) => {
	const arbState: number[][] =
		props.level === 1 ? saveFileLevel2.matrix : saveFileLevel3.matrix;

	const goodMatrix = props.possibleMatrix ? props.possibleMatrix : arbState;
	const isStuck = props.possibleMatrix == null;

	return (
		<div className="rulesModalBackground">
			{isStuck && (
				<h1 className="rulesModalHeading">You are stuck! Backtrack!</h1>
			)}

			<h1 className="rulesModalHeading">Possible Solution: </h1>
			<div className="rulesModalGrid">
				{goodMatrix.map((row, rowIndex) =>
					row.map((cell, colIndex) => (
						<div
							key={`${rowIndex}-${colIndex}`}
							className={`gridCell
								${cell !== props.trueMatrix[rowIndex][colIndex] ? "solvedDelta" : ""}`}>
							{cell}
						</div>
					))
				)}
			</div>
			<button
				className="rulesModalClose"
				onClick={() => {
					props.closeFunction(false);
				}}>
				Close
			</button>
		</div>
	);
};

export default SolnModal;
