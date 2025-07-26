import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { accessLogFormat } from "./configs/log-format";
import { errorHandler } from "./middlewares/error-handler";
import type { Request, Response, NextFunction } from "express";
import githubRouter from "./routes/github.router";

// Import the correct types and the pre-initialized client
import {
  ClerkExpressRequireAuth,
  clerkClient,
  AuthObject,
} from "@clerk/clerk-sdk-node";

// Augment the Express Request type for TypeScript
declare global {
  namespace Express {
    interface Request {
      auth: AuthObject;
    }
  }
}

const app = express();

// --- Core Middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(accessLogFormat));

// --- Routes ---

async function getUserProfile(req: Request, res: Response, next: NextFunction) {
  // Use a try...catch block to handle any potential errors
  try {
    const { userId } = req.auth; // This is guaranteed by ClerkExpressRequireAuth

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(userId);

    res.json({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (error) {
    // Pass the error to the central error handler
    next(error);
  }
}

app.get("/users/me", ClerkExpressRequireAuth(), getUserProfile);
app.use("/api/github", githubRouter);

app.use(errorHandler);

export default app;
