import "./GameBoard.css";
import SingleCell from "../SingleCell/SingleCell";
import ToolbarButton from "../ToolbarButton/ToolbarButton";
import {
	getCellType,
	playSuccess,
	playFail,
	getRandomInteger,
	playVictory,
	deepCopyMatrix
} from "./helpers";
import { useState } from "react";
import downloadImg from "../assets/downloadImg.svg";
import uploadImg from "../assets/uploadImg.svg";
import resetImg from "../assets/resetImg.svg";
import undoImg from "../assets/undoImg.svg";
import skipImg from "../assets/skipImg.svg";
import themeImg from "../assets/themeImg.svg";
import { useTimer } from "../hooks/useTimer";
import { useUser, SignOutButton } from "@clerk/clerk-react";
import signOutImg from "../assets/signOutImg.svg";
import saveFileLevel2 from "../assets/saveFileLevel2.json";
import saveFileLevel3 from "../assets/saveFileLevel3.json";

// GameBoard instance - renders collection of SingleCells
const GameBoard = () => {
	// Logic for placing a random 1 per website refresh
	const initialMatrix = [
		[-1, -1, -1, -1, -1, -1, -1],
		[-1, 0, 0, 0, 0, 0, -1],
		[-1, 0, 0, 0, 0, 0, -1],
		[-1, 0, 0, 0, 0, 0, -1],
		[-1, 0, 0, 0, 0, 0, -1],
		[-1, 0, 0, 0, 0, 0, -1],
		[-1, -1, -1, -1, -1, -1, -1]
	];

	// USE DEEP COPY TO AVOID DUPLICATE 1 PLACEMENTS
	const randomX = getRandomInteger(1, 5);
	const randomY = getRandomInteger(1, 5);

	const tempCopy = deepCopyMatrix(initialMatrix);
	tempCopy[randomX][randomY] = 1;

	// PLACE INTERNAL STATE HERE
	// 2D array where each cell corresponds to a SingleCell
	const [matrix, setMatrix] = useState<number[][]>(tempCopy);

	// Internally tracks the next number to be placed - starts at 2 since 1 is autoplaced
	const [nextToPlace, setNextToPlace] = useState<number>(2);

	// Internally track the theme - 0 1 or 2
	const [theme, setTheme] = useState<number>(0);

	// Track stack of moves to for implementing undo feature
	const [cellPlacementHistory, setCellPlacementHistory] = useState<
		{ number: number; location: number[]; pointsEarned: number }[]
	>([{ number: 1, location: [randomX, randomY], pointsEarned: 0 }]);

	// Which "level" is active - used for handling input logic and rendering outer layer
	const [activeLevel, setActiveLevel] = useState<number>(1);

	// Current score
	const [score, setScore] = useState<number>(0);

	// Currently displayed error message - reset to null after each successful placement
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	// Unpack from custom useTimer hook
	const { currSeconds, resetTimer, setCurrSeconds } = useTimer({
		duration: 30
	});

	// Unpack user object from Clerk - no need to check isLoading since GameBoard is only loaded when logged in
	const { user } = useUser();

	// PULL PLAYER EMAIL FROM CLERK TO USE AS NAME
	const playerName = user?.emailAddresses[0].emailAddress;

	// PLACE METHODS HERE

	// Function for processing timer and score between each level
	function calculateTimeBonus(): void {
		setScore((p) => p + currSeconds);
		resetTimer();
	}

	//Function to log and save a completed level
	function logCompletedLevel(
		completedLevel: number,
		completedMatrix: number[][],
		finalScore: number
	): void {
		const logEntry = {
			playerName: playerName || "Anonymous",
			playDateTime: new Date().toISOString(),
			level: completedLevel,
			rewardsOrPoints: finalScore,
			currSeconds: currSeconds,
			completedBoard: completedMatrix.map((row) => [...row]) // Deep copy of matrix
		};

		const jsonToSave = JSON.stringify(logEntry, null, 2);
		const now = new Date().toISOString().replace(/[:.]/g, "-");
		const blob = new Blob([jsonToSave], { type: "application/json" });
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = `game-log-level-${completedLevel}-${now}.json`;
		a.click();
		URL.revokeObjectURL(url); // Clean up the URL object
	}

	// Function to save jsonified game state to client computer
	function saveGame(): void {
		// get snapshot of state
		const stateSnapshot = {
			matrix,
			nextToPlace,
			cellPlacementHistory,
			activeLevel,
			score,
			errorMsg,
			playerName,
			currSeconds
		};

		// JSONify
		const jsonToSave = JSON.stringify(stateSnapshot, null, 2);

		// Get formatted date to name download
		const now = new Date().toISOString().replace(/[:.]/g, "-");

		// Format download metadata
		const blob = new Blob([jsonToSave], { type: "application/json" });
		const url = URL.createObjectURL(blob);

		// Invoke download event in browser via DOM
		const a = document.createElement("a");
		a.href = url;
		a.download = `snapshot-${now}.json`;
		a.click();
	}

	// Function for loading saved game state from client computer
	function loadGame(): void {
		// Create DOM instance of input to manipulate
		const input = document.createElement("input");

		// Configure input instance
		input.type = "file";
		input.accept = ".json";

		// Specify onChange handler which grabs state and loads it
		input.onchange = () => {
			// Get file
			const file = input.files?.[0];
			// Do nothing if no file is selected
			if (!file) return;

			// Instantiate filereader
			const reader = new FileReader();

			// Define onLoad function that loads state from json
			reader.onload = () => {
				// Use try catch for error handling
				try {
					const parsed = JSON.parse(reader.result as string);

					setMatrix(parsed.matrix);
					setNextToPlace(parsed.nextToPlace);
					setCellPlacementHistory(parsed.cellPlacementHistory);
					setActiveLevel(parsed.activeLevel);
					setScore(parsed.score);
					setCurrSeconds(parsed.currSeconds);
					setErrorMsg(parsed.errorMsg);
				} catch {
					setErrorMsg("Selected File is Invalid.");
				}
			};

			reader.readAsText(file);
		};

		// Initialize file input diolog
		input.click();
	}

	// Define function for handling error, which, for now, is blank
	function handleError(msg: string): void {
		setErrorMsg(msg);
		playFail();
	}

	// Define function for processing a move in lvl 1 - accepts row column coordinates and cell type positionally
	function processLvl1Move(r: number, c: number, cellType: string): void {
		// NOTE: For now, all invalid inputs will be blocked via the empty "handleError" method

		// Error on accessing lvl 2 cell early
		if (cellType !== "grey") {
			handleError("Level 2 not yet unlocked.");
			return;
		}

		// Case where "1" is being placed
		if (nextToPlace == 1) {
			// Accept unconditionally
			setMatrix((prev) => {
				prev[r][c] = nextToPlace;
				return prev;
			});
			setCellPlacementHistory([
				...cellPlacementHistory,
				{ number: nextToPlace, location: [r, c], pointsEarned: 0 }
			]);
			setNextToPlace((prev) => prev + 1);
			playSuccess();
			return;
		}

		// Case where "2" through "25" is being placed
		// Source coordinates of last placed cell
		const lr =
			cellPlacementHistory[cellPlacementHistory.length - 1].location[0];
		const lc =
			cellPlacementHistory[cellPlacementHistory.length - 1].location[1];
		let pointsEarned = 0;

		// Error on selecting non-adjacent cell
		if (Math.abs(r - lr) > 1 || Math.abs(c - lc) > 1) {
			handleError(
				"Cannot place number in non-adjacent cell during level 1."
			);
			return;
		}

		// Error on selecting filled cell
		if (matrix[r][c] !== 0) {
			handleError("Cannot place number in already filled cell.");
			return;
		}

		//Prompt player to enter the number
		const enteredNumber = prompt("Enter the number to place:");
		if (enteredNumber === null || parseInt(enteredNumber) !== nextToPlace) {
			handleError(`Invalid number entered. Expected ${nextToPlace}.`);
			return;
		}

		// Conditionally assign point
		if (Math.abs(r - lr) == 1 && Math.abs(c - lc) == 1) {
			pointsEarned++;
			setScore((prev) => prev + 1);
		}

		// If no error blocked placement - update matrix
		setMatrix((prev) => {
			prev[r][c] = nextToPlace;
			return prev;
		});

		// Conditionally activate level 2
		if (nextToPlace == 25) {
			//Log completed Level 1 before transitioning
			const completedBoard = deepCopyMatrix(matrix);
			completedBoard[r][c] = 25;
			calculateTimeBonus();
			logCompletedLevel(1, completedBoard, score + pointsEarned);
			setActiveLevel(2);
			setCellPlacementHistory([
				...cellPlacementHistory,
				{
					number: nextToPlace,
					location: [r, c],
					pointsEarned: pointsEarned
				}
			]);
			setNextToPlace(2);
			// Clear "-1" from lvl 2 cells
			setMatrix((prevMatrix) =>
				prevMatrix.map((row) => row.map((v) => (v === -1 ? 0 : v)))
			);

			playSuccess();
			return;
		}

		setCellPlacementHistory([
			...cellPlacementHistory,
			{
				number: nextToPlace,
				location: [r, c],
				pointsEarned: pointsEarned
			}
		]);
		setNextToPlace((prev) => prev + 1);
		setErrorMsg(null);
		playSuccess();
	}

	// Define function for processing a move in lvl2 - accepts row column coordinates positionally
	function processLvl2Move(r: number, c: number, cellType: string): void {
		// error on trying to place in previous level
		if (cellType == "grey") {
			handleError("Cannot place in level 1.");
			return;
		}

		// get the position in level 1 of the number to be placed in level 2
		// sr/c = source row/column
		const sr = cellPlacementHistory[nextToPlace - 1].location[0];
		const sc = cellPlacementHistory[nextToPlace - 1].location[1];

		// check validity of placement for non-diagonals, diagonals, and center
		if (
			![
				[sr, 0],
				[0, sc],
				[sr, 6],
				[6, sc]
			].some(([a, b]) => a === r && b === c) &&
			(![
				[1, 1],
				[2, 2],
				[3, 3],
				[4, 4],
				[5, 5]
			].some(([a, b]) => a === sr && b === sc) ||
				![
					[0, 0],
					[6, 6]
				].some(([a, b]) => a === r && b === c)) &&
			(![
				[5, 1],
				[4, 2],
				[3, 3],
				[2, 4],
				[1, 5]
			].some(([a, b]) => a === sr && b === sc) ||
				![
					[6, 0],
					[0, 6]
				].some(([a, b]) => a === r && b === c))
		) {
			// handle incorrect placements
			handleError("Lvl 2 placements must relate to lvl 1 placements.");
			return;
		}

		// error on trying to place in already filled cell
		if (matrix[r][c] > 0) {
			handleError("Cannot place number in already filled cell.");
			return;
		}

		//Prompt player to enter the number
		const enteredNumber = prompt("Enter the number to place:");
		if (enteredNumber === null || parseInt(enteredNumber) !== nextToPlace) {
			handleError(`Invalid number entered. Expected ${nextToPlace}.`);
			return;
		}

		setMatrix((prev) => {
			prev[r][c] = nextToPlace;
			return prev;
		});
		setScore((prev) => prev + 1);
		setErrorMsg(null);
		playSuccess();

		if (nextToPlace == 25) {
			//Log Completed Level 2
			const completedBoard = deepCopyMatrix(matrix);
			completedBoard[r][c] = 25;
			calculateTimeBonus();
			logCompletedLevel(2, completedBoard, score);
			setActiveLevel(3);
			setNextToPlace(2);
			const newMatrix = [...matrix];
			for (let i = 1; i < 25; i++) {
				const cellLocation = cellPlacementHistory[i].location;
				newMatrix[cellLocation[0]][cellLocation[1]] = 0;
			}
			setMatrix(newMatrix);
			setCellPlacementHistory([
				...cellPlacementHistory,
				{ number: nextToPlace, location: [r, c], pointsEarned: 1 },
				{
					number: 1,
					location: cellPlacementHistory[0].location,
					pointsEarned: 0
				}
			]);
		} else {
			setCellPlacementHistory([
				...cellPlacementHistory,
				{ number: nextToPlace, location: [r, c], pointsEarned: 1 }
			]);
			setNextToPlace((prev) => prev + 1);
		}
	}

	// Define function for processing a move in lvl3 - accepts row column and cell type coordinates positionally
	function processLvl3Move(r: number, c: number, cellType: string): void {
		// error on trying to place in previous level
		if (cellType !== "grey") {
			handleError("Cannot place in level 2.");
			return;
		}

		// Case where "2" through "25" is being placed
		// Source coordinates of last placed cell
		const lr =
			cellPlacementHistory[cellPlacementHistory.length - 1].location[0];
		const lc =
			cellPlacementHistory[cellPlacementHistory.length - 1].location[1];

		// Error on selecting non-adjacent cell
		if (Math.abs(r - lr) > 1 || Math.abs(c - lc) > 1) {
			handleError(
				"Cannot place number in non-adjacent cell during level 3."
			);
			return;
		}

		// get the position in level 2 of the number to be placed in level 3
		// sr/c = source row/column
		const sr = cellPlacementHistory
			.slice(25)
			.find((cell) => cell.number == nextToPlace)?.location[0];
		const sc = cellPlacementHistory
			.slice(25)
			.find((cell) => cell.number == nextToPlace)?.location[1];

		// check validity of placement
		if (
			![
				[r, 0],
				[0, c],
				[r, 6],
				[6, c]
			].some(([a, b]) => a === sr && b === sc) &&
			(![
				[0, 0],
				[6, 6]
			].some(([a, b]) => a === sr && b === sc) ||
				![
					[1, 1],
					[2, 2],
					[3, 3],
					[4, 4],
					[5, 5]
				].some(([a, b]) => a === r && b === c)) &&
			(![
				[6, 0],
				[0, 6]
			].some(([a, b]) => a === sr && b === sc) ||
				![
					[5, 1],
					[4, 2],
					[3, 3],
					[2, 4],
					[1, 5]
				].some(([a, b]) => a === r && b === c))
		) {
			// handle incorrect placements
			handleError("Lvl 3 placements must relate to lvl 2 placements.");
			return;
		}

		// Error on trying to place in already filled cell
		if (matrix[r][c] > 0) {
			handleError("Cannot place number in already filled cell.");
			return;
		}

		//Prompt player to enter the number
		const enteredNumber = prompt("Enter the number to place:");
		if (enteredNumber === null || parseInt(enteredNumber) !== nextToPlace) {
			handleError(`Invalid number entered. Expected ${nextToPlace}.`);
			return;
		}

		setMatrix((prev) => {
			prev[r][c] = nextToPlace;
			return prev;
		});
		setCellPlacementHistory([
			...cellPlacementHistory,
			{ number: nextToPlace, location: [r, c], pointsEarned: 1 }
		]);
		setScore((prev) => prev + 1);
		setErrorMsg(null);
		if (nextToPlace == 25) {
			//Log Completed Level 3
			const completedBoard = deepCopyMatrix(matrix);
			completedBoard[r][c] = 25;
			calculateTimeBonus();
			logCompletedLevel(3, completedBoard, score);
			playVictory();
		} else {
			playSuccess();
			setNextToPlace((prev) => prev + 1);
		}
	}

	// Define function for undoing a cell placement. Deny undos when next to place is 1.
	function undoCellPlacement() {
		if (activeLevel == 1 && nextToPlace <= 2) {
			handleError("Cannot undo from the start of the game.");
			return;
		} else if (activeLevel == 2 && nextToPlace <= 2) {
			handleError("Cannot undo from Level 2 to Level 1.");
			return;
		} else if (activeLevel == 3 && nextToPlace <= 2) {
			handleError("Cannot undo from Level 3 to Level 2.");
			return;
		}

		const lastCellPlacement = cellPlacementHistory.pop();
		if (lastCellPlacement) {
			const newMatrix = [...matrix];
			newMatrix[lastCellPlacement.location[0]][
				lastCellPlacement.location[1]
			] = 0;
			setMatrix(newMatrix);
			setNextToPlace((prev) => prev - 1);

			if (lastCellPlacement.pointsEarned > 0) {
				setScore((prev) => prev - lastCellPlacement.pointsEarned);
			}
		}
	}

	// Define function for clearing the board, keeping only the 1's placement.
	function clearBoard() {
		if (activeLevel == 1 && nextToPlace <= 2) {
			handleError("Cannot clear board from the start of the game.");
			return;
		} else if (activeLevel == 2 && nextToPlace <= 2) {
			handleError("Cannot clear board from Level 2 to Level 1.");
			return;
		} else if (activeLevel == 3 && nextToPlace <= 2) {
			handleError("Cannot clear board from Level 3 to Level 2.");
			return;
		}

		const newMatrix = [...initialMatrix];
		let cellsSaved = 1;
		let scoreSaved = 0;

		if (activeLevel == 2) {
			cellsSaved = 25;
			newMatrix.forEach((row, i) => {
				newMatrix[i] = row.map((col) => (col === -1 ? 0 : col));
			});
		} else if (activeLevel == 3) {
			cellsSaved = 50;
		}

		let i = activeLevel == 3 ? 25 : 0;

		for (i; i < cellsSaved; i++) {
			const cellPlacement = cellPlacementHistory[i];
			newMatrix[cellPlacement.location[0]][cellPlacement.location[1]] =
				cellPlacement.number;
			scoreSaved += cellPlacement.pointsEarned;
		}

		setCellPlacementHistory(cellPlacementHistory.slice(0, cellsSaved));
		setMatrix(newMatrix);
		setNextToPlace(2);
		setScore(scoreSaved);
		resetTimer();
	}

	function skipLevel() {
		let saveFile = null;

		switch (activeLevel) {
			case 1:
				saveFile = saveFileLevel2;
				break;
			case 2:
				saveFile = saveFileLevel3;
				break;
			default:
				handleError("Cannot skip the last level.");
				return;
		}

		setMatrix(saveFile.matrix);
		setNextToPlace(saveFile.nextToPlace);
		setCellPlacementHistory(saveFile.cellPlacementHistory);
		setActiveLevel(saveFile.activeLevel);
		setScore(saveFile.score);
		setCurrSeconds(saveFile.currSeconds);
		setErrorMsg(saveFile.errorMsg);
	}

	// Return Grid of SingleCells, passing corresponding matrix value to each
	return (
		<div className="verticalParent">
			<div className="horizontalParent">
				<ToolbarButton
					label="Save Game"
					onClick={() => saveGame()}
					bgColor="green"
					icon={downloadImg}
				/>
				<ToolbarButton
					label="Load Game"
					onClick={() => loadGame()}
					bgColor="purple"
					icon={uploadImg}
				/>

				<ToolbarButton
					label="Undo"
					onClick={undoCellPlacement}
					bgColor="lightGreen"
					icon={undoImg}
				/>
				<ToolbarButton
					label="Clear"
					onClick={clearBoard}
					bgColor="lightPurple"
					icon={resetImg}
				/>
			</div>
			<div className="horizontalParent">
				<SignOutButton>
					<ToolbarButton
						label="Sign Out"
						onClick={() => clearBoard()}
						bgColor="blue"
						icon={signOutImg}
					/>
				</SignOutButton>
				<ToolbarButton
					label="Skip Level"
					onClick={skipLevel}
					bgColor="red"
					icon={skipImg}
				/>
				<ToolbarButton
					label="Theme"
					onClick={() =>
						setTheme((prev) => (prev === 2 ? 0 : prev + 1))
					}
					bgColor="yellow"
					icon={themeImg}
				/>
			</div>
			<div className="horizontalParent">
				<div
					className={`grid7x7 ${theme === 1 ? "secondaryBg" : ""} ${theme === 2 ? "tertiaryBg" : ""}`}>
					{matrix.map((row, rowCount) =>
						row.map((cellValue, cellCount) => {
							const currLoop = rowCount * 7 + cellCount;
							return (
								<SingleCell
									value={cellValue}
									cellType={getCellType(currLoop)}
									row={rowCount}
									column={cellCount}
									onClick={
										activeLevel == 1
											? processLvl1Move
											: activeLevel == 2
												? processLvl2Move
												: processLvl3Move
									}
									selected={
										cellPlacementHistory.length > 0 &&
										rowCount ==
											cellPlacementHistory[
												cellPlacementHistory.length - 1
											].location[0] &&
										cellCount ==
											cellPlacementHistory[
												cellPlacementHistory.length - 1
											].location[1]
									}
									theme={theme}
								/>
							);
						})
					)}
				</div>
				<div className="verticalParent">
					<p className="helperText">Player Name: {playerName}</p>
					<p className="helperText">Current Level: {activeLevel}</p>
					<p className="helperText">Time Remaining: {currSeconds}</p>
					<p className="helperText">Current Score is: {score}</p>
					<p className="helperText">
						Next Number to Place is:{" "}
						{nextToPlace == 26 ? "You Win!" : nextToPlace}
					</p>
					<p
						className={`helperText errorText ${errorMsg ? "" : "hidden"}`}>{`Error: ${errorMsg}`}</p>
				</div>
			</div>
		</div>
	);
};

export default GameBoard;
