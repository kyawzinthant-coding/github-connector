import "./App.css";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { useState } from "react";
import RepoSelector from "./RoleSelector";
import RepoDetails from "./RepoDetails";

function App() {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  return (
    <>
      <p>Hello World!</p>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>

      <h1>GitHub Repository Viewer</h1>
      <RepoSelector onRepoSelect={setSelectedRepo} />
      <hr />
      <RepoDetails repoFullName={selectedRepo} />
    </>
  );
}

export default App;
