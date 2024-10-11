// src/index.ts
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("<h1>Hello World!</h1> <p>Express server is running...</p>");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});