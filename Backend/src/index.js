import app from "./app.js";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const port = Number(process.env.PORT) || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeLogPath = path.resolve(__dirname, "../runtime-errors.log");

function logRuntimeError(kind, error) {
  const timestamp = new Date().toISOString();
  const stack =
    error instanceof Error ? error.stack || error.message : String(error);
  const entry = `[${timestamp}] ${kind}\n${stack}\n\n`;

  console.error(entry);

  try {
    fs.appendFileSync(runtimeLogPath, entry, "utf8");
  } catch (logError) {
    console.error("Failed to write runtime log:", logError);
  }
}

process.on("unhandledRejection", (reason) => {
  logRuntimeError("Unhandled Rejection", reason);
});

process.on("uncaughtException", (error) => {
  logRuntimeError("Uncaught Exception", error);
});

app.listen(port, '0.0.0.0' , () => {
  console.log(`GitHub profile verifier listening on port ${port}`);
  console.log(`Runtime errors will be logged to ${runtimeLogPath}`);
});

setInterval(() => {}, 1000 * 60 * 60);
