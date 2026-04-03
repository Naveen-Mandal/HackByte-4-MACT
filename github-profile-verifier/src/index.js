require("dotenv").config();

const app = require("./app");

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`GitHub profile verifier listening on port ${port}`);
});
