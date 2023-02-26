const { parse } = require("@apidevtools/swagger-parser");
const SwaggerParser = require("@apidevtools/swagger-parser");
const { json } = require("body-parser");
const OpenAPIRequestValidator = require("openapi-request-validator").default;
const cloneDeep = require("lodash.clonedeep");

const defaultFn = (prop) => {
  if (prop) {
    return prop;
  }
  return null;
};

async function getRequestValidator({
  path,
  method,
  specJson,
  requestBodyContentType,
}) {
  const parsedSpec = await SwaggerParser.validate(specJson);
  // console.log(JSON.stringify(parsedSpec.paths[path][method]));
  const requestBody = cloneDeep(parsedSpec.paths[path][method].requestBody);

  requestBody.content[requestBodyContentType].schema = {
    $ref: "#/definitions/RequestBody",
  };
  const parameters = parsedSpec.paths[path][method].parameters;
  const schemaForCurrentContentType =
    parsedSpec.paths[path][method].requestBody.content[requestBodyContentType]
      .schema;

  console.log(schemaForCurrentContentType, requestBodyContentType);

  const customOption = {
    parameters,
    requestBody,
    schemas: {
      RequestBody: {
        type: schemaForCurrentContentType.type,
        required: schemaForCurrentContentType.required,
        properties: schemaForCurrentContentType.properties,
        additionalProperties: false,
      },
    },
    errorTransformer: (openApiError, jsonSchemaError) => {
      console.log({ openApiError, jsonSchemaError });

      return jsonSchemaError;
    },
    // customFormats: defaultFn(specOption.customFormats),
  };

  console.log(JSON.stringify(customOption));
  return new OpenAPIRequestValidator(customOption);
}

async function validate(specObj, request) {
  const requestValidator = await getRequestValidator(specObj);

  const errors = requestValidator.validateRequest(request);
  return errors;
}

module.exports = validate;
