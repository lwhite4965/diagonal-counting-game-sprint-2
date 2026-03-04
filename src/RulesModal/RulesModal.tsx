import "./RulesModal.css";

const RulesModal = (props: {
	level: number;
	closeFunction: (newState: boolean) => void;
}) => {
	const rulesText = {
		"1": `
1. Fill in the rest cells in the order from 2 to 25 consecutively, one per cell till end.\n
2. The successor (e.g., 2) must be only one step away from its predecessor (e.g., 1) in any direction including diagonal cells—ideally, one of eight as shown but could be less, depending on the location of the predecessor and if a cell is occupied.\n
3. You earn one point whenever a number is placed at one of the diagonal corner cells of its predecessor and zero point, otherwise.`,
		"2": `
1. Fill in the cells in the outer ring surrounding the board with numbers from 2 to 25.\n
2. Because every number in the inner 5x5 board is placed at the intersection of one row and one column, the number to be placed in the outer ring can only go to either end of the row or column of the number (i.e., one of four blue cells).\n
3. If the number in the inner 5x5 board is placed in a cell which also belongs to one of the two longest diagonals of the board, the number can also be placed in either of the two yellow cells of the diagonal in the outer ring.\n
4. You earn one point for every cell placement.`,
		"3": `
1. Fill numbers from 2 to 25 back in the cells of the inner 5x5 grid with the same rules of Level 1 plus two more rules below.\n
2. The cell to place a number must be the intersection of a row and a column with the number printed in either end of the row or column.\n
3. If the number to be entered is printed in a yellow cell (i.e., one of the four corner cells of the ring), it must be entered in a cell that is part of the two longest diagonals of the board.\n
4. You earn one point for every cell placement.`
	};
	return (
		<div className="rulesModalBackground">
			<h1 className="rulesModalHeading">Rules - Level {props.level}</h1>
			<p className="rulesModalText">
				{rulesText[props.level as 1 | 2 | 3]}
			</p>
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

export default RulesModal;
