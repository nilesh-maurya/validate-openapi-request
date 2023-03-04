const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const validate = require("./validate");

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.post("/validate", async (req, res) => {
  const specObj = {
    path: req.body.path,
    method: req.body.method,
    specJson: req.body.specJson,
    requestBodyContentType: req.body.requestBodyContentType,
  };

  if (specObj.requestBodyContentType != "application/json") {
    return res.json({
      resultStatus: "Failed",
      error: [
        {
          message:
            "Unsupported media type, Make sure request body is application/json",
        },
      ],
    });
  }

  const requestObj = {
    headers: {
      "content-type": req.body.requestBodyContentType,
      ...req.body.parameter.header,
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
  // console.dir(result);
  res.json({
    resultStatus: "Success",
    error: result != undefined ? result : null,
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
