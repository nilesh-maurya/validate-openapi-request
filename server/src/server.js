const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const validate = require("./validate");

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.post("/validate", async (req, res) => {
  // console.log(req.body);

  const specObj = {
    path: req.body.path,
    method: req.body.method,
    specJson: req.body.specJson,
    requestBodyContentType: req.body.requestBodyContentType,
  };

  const requestObj = {
    headers: {
      "content-type": req.body.requestBodyContentType,
      ...req.body.parameter.headers,
    },
    query: {
      ...req.body.parameter.query,
    },
    params: {
      ...req.body.parameter.path,
    },
    body: JSON.parse(req.body.reqBody),
  };

  const result = await validate(specObj, requestObj);
  console.log(result);
  res.json({
    resultStatus: "Success",
    error: result != undefined ? result : null,
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
