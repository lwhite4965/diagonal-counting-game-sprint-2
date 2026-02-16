import "./LoggedOut.css";
import { SignUpButton, SignInButton } from "@clerk/clerk-react";

export const LoggedOut = () => {
	return (
		<div className={"vertParent"}>
			<SignInButton mode="modal">
				<button className="authBtn">Log In</button>
			</SignInButton>
			<SignUpButton>
				<button className="authBtn">Sign Up</button>
			</SignUpButton>
		</div>
	);
};

export default LoggedOut;
