import validate from "./validate";

 async function ValidateRequest(req) {
    try {
      const specObj = {
        path: req.body.path,
        method: req.body.method,
        specJson: req.body.specJson,
        requestBodyContentType: req.body.requestBodyContentType,
      };
    
      if (
        specObj.requestBodyContentType != null &&
        specObj.requestBodyContentType != "application/json"
      ) {
        return {
          resultStatus: "Failed",
          error: {
            errors: [
              {
                customMessage:
                  "Unsupported media type, Make sure request body is application/json",
              },
            ],
          },
        };
      }
    
      const requestObj = {
        clientReq: req.body,
        req: {
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
        },
      };
      const result = await validate(specObj, requestObj);
      return {
        resultStatus: result != undefined ? "Failed" : "Success",
        error: result != undefined ? result : null,
      };
    } catch (err) {
      console.log(err);
      return {
        resultStatus: "Failed",
        error: {
          errors: [
            {
              customMessage: "Something Went Wrong.",
              ...err,
            },
          ],
        },
      };
    }
    
}

export default server = {ValidateRequest}
