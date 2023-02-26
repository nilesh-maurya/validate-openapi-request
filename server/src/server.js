const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.post("/validate", (req, res) => {
  console.log(req.body);

  res.json({
    resultStatus: "Success",
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
