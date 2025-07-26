import { Router } from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import {
  getUserRepos,
  getRepoDetails,
  startRepoAnalysis,
} from "../controller/github.controller";

const router = Router();

// All routes in this file will be protected and require authentication
router.use(ClerkExpressRequireAuth());

router.get("/repos", getUserRepos);
router.get("/repos/:owner/:repo/details", getRepoDetails);
router.post("/analysis/start", startRepoAnalysis);

export default router;
