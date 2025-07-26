import { clerkClient } from "@clerk/clerk-sdk-node";
import type { Request, Response, NextFunction } from "express";

// A helper function to keep our GitHub fetch logic clean
async function fetchFromGitHub(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`GitHub API error: ${response.status}`);
  }
  return response.json();
}

// --- Controller for GET /api/github/repos ---
export async function getUserRepos(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.auth;
    const { page = "1", per_page = "30" } = req.query;
    const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
      userId!,
      "oauth_github"
    );
    const accessToken = clerkResponse.data[0]?.token;

    if (!accessToken) {
      return res.status(404).json({ error: "GitHub access token not found." });
    }

    const githubApiUrl = `https://api.github.com/user/repos?page=${page}&per_page=${per_page}&sort=updated`;
    const repos = await fetchFromGitHub(githubApiUrl, accessToken);
    res.json(repos);
  } catch (error) {
    next(error);
  }
}

// --- Controller for GET /api/github/repos/:owner/:repo/details ---
export async function getRepoDetails(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.auth;
    const { owner, repo } = req.params;
    const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
      userId!,
      "oauth_github"
    );
    const accessToken = clerkResponse.data[0]?.token;

    if (!accessToken) {
      return res.status(404).json({ error: "GitHub token not found." });
    }

    const [repoData, rootContents] = await Promise.all([
      fetchFromGitHub(
        `https://api.github.com/repos/${owner}/${repo}`,
        accessToken
      ),
      fetchFromGitHub(
        `https://api.github.com/repos/${owner}/${repo}/contents/`,
        accessToken
      ),
    ]);

    if (!repoData) {
      return res.status(404).json({ error: "Repository not found." });
    }

    const readmeFile = rootContents?.find((file: any) =>
      file.name.toLowerCase().startsWith("readme")
    );
    let readmeContent: string | undefined;
    if (readmeFile) {
      const readmeData = await fetchFromGitHub(readmeFile.url, accessToken);
      if (readmeData) {
        readmeContent = Buffer.from(readmeData.content, "base64").toString(
          "utf-8"
        );
      }
    }

    res.json({
      repo: repoData,
      files: rootContents || [],
      readme: readmeContent,
    });
  } catch (error) {
    next(error);
  }
}

// --- Controller for POST /api/analysis/start ---
export async function startRepoAnalysis(req: Request, res: Response) {
  const { fullName } = req.body;
  const { userId } = req.auth;

  if (!fullName) {
    return res.status(400).json({ error: "Repository fullName is required." });
  }

  // Instantly respond to the frontend
  res.status(202).json({ message: "Analysis job started." });

  // Start the background job without waiting for it to finish
  performRepoAnalysis(userId!, fullName).catch((err) => {
    console.error(
      `[Analysis Job] A critical error occurred for ${fullName}:`,
      err
    );
  });
}

// --- The background job logic ---
async function performRepoAnalysis(userId: string, repoFullName: string) {
  console.log(`[Analysis Job] Starting for ${repoFullName}`);
  const [owner, repo] = repoFullName.split("/");

  const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
    userId,
    "oauth_github"
  );
  const accessToken = clerkResponse.data[0]?.token;
  if (!accessToken) {
    return console.error(`[Analysis Job] No token for ${repoFullName}`);
  }

  const branchInfo = await fetchFromGitHub(
    `https://api.github.com/repos/${owner}/${repo}`,
    accessToken
  );
  if (!branchInfo)
    return console.error(
      `[Analysis Job] Could not fetch repo info for ${repoFullName}`
    );

  const treeData = await fetchFromGitHub(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branchInfo.default_branch}?recursive=1`,
    accessToken
  );
  if (!treeData?.tree) {
    return console.error(
      `[Analysis Job] Could not fetch file tree for ${repoFullName}`
    );
  }

  let allCodeContent = "";
  for (const file of treeData.tree) {
    if (file.type === "blob" && file.url) {
      // Only fetch content for files (blobs)
      const fileData = await fetchFromGitHub(file.url, accessToken);
      if (fileData?.content) {
        const content = Buffer.from(fileData.content, "base64").toString(
          "utf-8"
        );
        allCodeContent += `\n\n--- File: ${file.path} ---\n\n${content}`;
      }
    }
  }

  console.log(
    `[Analysis Job] Total characters fetched: ${allCodeContent.length}. Ready for bot analysis.`
  );
  // --- YOUR BOT/AI ANALYSIS LOGIC GOES HERE ---
  console.log(`[Analysis Job] Finished for ${repoFullName}`);
}
