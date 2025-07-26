import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import ReactMarkdown from "react-markdown"; // Import the markdown component

// Define the shape of our data
interface GitHubRepo {
  id: number;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
}
interface GitHubFile {
  path: string;
  type: "file" | "dir";
  name: string;
}
interface RepoData {
  repo: GitHubRepo;
  files: GitHubFile[];
  readme?: string;
}

interface RepoDetailsProps {
  repoFullName: string | null;
}

const RepoDetails: React.FC<RepoDetailsProps> = ({ repoFullName }) => {
  const handleAnalysis = async () => {
    if (!repoFullName) return;

    // Show immediate feedback to the user
    alert(
      "Analysis has started! This may take a few minutes. We'll notify you when it's done."
    );

    const clerkToken = await getToken();

    // Just send the repo name to the new endpoint
    await fetch("/api/analysis/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clerkToken}`,
      },
      body: JSON.stringify({ fullName: repoFullName }),
    });
  };

  const { getToken } = useAuth();
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoFullName) {
      setRepoData(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const clerkToken = await getToken();
        const response = await fetch(
          `/api/github/repos/${repoFullName}/details`,
          {
            headers: { Authorization: `Bearer ${clerkToken}` },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load repository details.");
        }
        const data: RepoData = await response.json();
        setRepoData(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [repoFullName, getToken]);

  if (!repoFullName)
    return <p className="info-message">Please select a repository.</p>;
  if (loading)
    return (
      <p className="info-message">Loading details for {repoFullName}...</p>
    );
  if (error) return <p className="info-message">Error: {error}</p>;
  if (!repoData) return null; // Should not happen if not loading and no error

  return (
    <div className="repo-details-card">
      <div className="repo-header">
        <h3 className="repo-title">{repoData.repo.full_name}</h3>
      </div>

      <button onClick={handleAnalysis}>Analyze</button>

      <p>{repoData.repo.description}</p>
      <div className="repo-stats">
        <span>⭐ {repoData.repo.stargazers_count} Stars</span>
        <span>🍴 {repoData.repo.forks_count} Forks</span>
        <span>{repoData.repo.language}</span>
        <a
          href={repoData.repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </div>

      <div className="repo-section">
        <h4>File Browser</h4>
        <ul className="file-tree">
          {repoData.files.map((node) => (
            <li className="file-node" key={node.path}>
              <span className="file-node-icon">
                {node.type === "dir" ? "📁" : "📄"}
              </span>
              <span>{node.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {repoData.readme && (
        <div className="repo-section">
          <h4>README.md</h4>
          {/* Use the ReactMarkdown component to render the README */}
          <article style={{ color: "black" }} className="markdown-body">
            <ReactMarkdown>{repoData.readme}</ReactMarkdown>
          </article>
        </div>
      )}
    </div>
  );
};

export default RepoDetails;
