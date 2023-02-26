const SwaggerParser = require("@apidevtools/swagger-parser");
const OpenAPIRequestValidator = require("openapi-request-validator").default;

const data = require("./spec.json");

async function init() {
  try {
    console.log(data);
    const api = await SwaggerParser.validate(data);
    console.log(
      JSON.stringify(api.paths["/vaults/{vaultUuid}/items"].post.requestBody)
    );
  } catch (err) {
    console.log(err);
  }
}

const validateRequest = (request, specOption) => {
  const defaultFn = (prop) => {
    if (prop) {
      return prop;
    }
    return null;
  };
  const customOption = {
    parameters: defaultFn(specOption.parameters),
    requestBody: defaultFn(specOption.requestBody),
    schemas: defaultFn(specOptions.schemas),
    errorTransformer: defaultFn(specOption.errorTransformer),
    customFormats: defaultFn(specOption.customFormats),
  };
  const requestValidator = new OpenAPIRequestValidator(customOption);

  const errors = requestValidator.validateRequest({
    headers: {
      "content-type": specOption.requestBody.content,
    },
    body: request.body,
    params: request.params,
    query: request.query,
  });

  if (errors) {
    return errors;
  }

  return "Request is valid.";
};

init();
