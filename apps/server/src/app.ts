import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import cors from "cors";
import { accessLogFormat } from "./configs/log-format";
import { errorHandler } from "./middlewares/error-handler";

import prisma from "./lib/prisma";

const app = express();

app.use(helmet());

app.use(cors());

app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.use(express.json());

app.use(morgan(accessLogFormat));

app.use(errorHandler);

export default app;
