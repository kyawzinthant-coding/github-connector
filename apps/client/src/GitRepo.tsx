import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

interface GitHubRepo {
  id: number;
  name: string;
  html_url: string;
  private: boolean;
}

const GitHubRepos: React.FC = () => {
  const { getToken } = useAuth();

  // 2. Type your state variables
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRepos = async () => {
      try {
        const clerkToken = await getToken();

        const response = await fetch("/api/github/repos", {
          headers: { Authorization: `Bearer ${clerkToken}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch repositories.");
        }

        // 3. The fetched data is now typed as an array of GitHubRepo objects
        const data: GitHubRepo[] = await response.json();
        setRepos(data);
      } catch (err: unknown) {
        // 4. Handle errors in a type-safe way
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserRepos();
  }, [getToken]);

  if (loading) {
    return <div>Loading your repositories...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Your GitHub Repositories</h2>
      <ul>
        {/* The 'repo' parameter is now correctly typed as GitHubRepo */}
        {repos.map((repo) => (
          <li key={repo.id}>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
              {repo.name}
            </a>
            {repo.private && (
              <span style={{ marginLeft: "8px", color: "#888" }}>
                (Private)
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GitHubRepos;
