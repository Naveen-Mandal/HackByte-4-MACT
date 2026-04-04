import app from "./app.js";
import "dotenv/config";

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`GitHub profile verifier listening on port ${port}`);
});

setInterval(() => {}, 1000 * 60 * 60);
