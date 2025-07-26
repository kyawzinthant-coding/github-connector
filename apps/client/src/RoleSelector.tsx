import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";

interface Repo {
  id: number;
  full_name: string;
}

interface RepoSelectorProps {
  onRepoSelect: (repoFullName: string) => void;
}

const REPOS_PER_PAGE = 30;

const RepoSelector: React.FC<RepoSelectorProps> = ({ onRepoSelect }) => {
  const { getToken } = useAuth();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true); // To know when to stop loading

  const fetchRepos = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      const clerkToken = await getToken();
      const response = await fetch(
        `/api/github/repos?page=${pageNum}&per_page=${REPOS_PER_PAGE}`,
        {
          headers: { Authorization: `Bearer ${clerkToken}` },
        }
      );

      console.log(response);

      if (!response.ok) {
        // If the response is not OK, throw an error to be caught below
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }
      const data: Repo[] = await response.json();

      // Append new repos to the existing list
      setRepos((prevRepos) => [...prevRepos, ...data]);

      // If we received fewer repos than we asked for, there are no more pages
      if (data.length < REPOS_PER_PAGE) {
        setHasMore(false);
      }

      setLoading(false);
    },
    [getToken]
  );

  // Fetch the initial page of repos
  useEffect(() => {
    fetchRepos(1);
  }, [fetchRepos]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRepos(nextPage);
  };

  return (
    <div>
      <select onChange={(e) => onRepoSelect(e.target.value)} defaultValue="">
        <option value="" disabled>
          -- Select a Repository --
        </option>
        {repos.map((repo) => (
          <option key={repo.id} value={repo.full_name}>
            {repo.full_name}
          </option>
        ))}
      </select>

      {loading && <p>Loading...</p>}

      {hasMore && !loading && (
        <button onClick={handleLoadMore} style={{ marginTop: "10px" }}>
          Load More
        </button>
      )}
    </div>
  );
};

export default RepoSelector;
