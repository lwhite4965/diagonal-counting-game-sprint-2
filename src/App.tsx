import GameBoard from "./GameBoard/GameBoard";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import LoggedOut from "./LoggedOut/LoggedOut";
import "./App.css";

// Grab pub Clerk key
const PUB_KEY_CLERK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
	return (
		<ClerkProvider publishableKey={PUB_KEY_CLERK}>
			{/* Return GameBoard when signed in */}
			<SignedIn>
				<GameBoard />
			</SignedIn>
			{/* Return LoggedOut when signed out */}
			<SignedOut>
				<LoggedOut />
			</SignedOut>
		</ClerkProvider>
	);
}

export default App;
