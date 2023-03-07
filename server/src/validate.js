const { parse } = require("@apidevtools/swagger-parser");
const SwaggerParser = require("@apidevtools/swagger-parser");
const { json } = require("body-parser");
const OpenAPIRequestValidator = require("openapi-request-validator").default;
const cloneDeep = require("lodash.clonedeep");

function getParametersForOpenApiRV({ parsedSpec, path, method }) {
  return parsedSpec.paths[path][method].parameters;
}

function getRequestBodyForOpenApiRV({
  parsedSpec,
  path,
  method,
  requestBodyContentType,
}) {
  const requestBody = cloneDeep(parsedSpec.paths[path][method].requestBody);
  requestBody.content[requestBodyContentType].schema = {
    $ref: "#/definitions/RequestBody",
  };

  return requestBody;
}

function addAdditionalProperties(obj, { additionalProperties }) {
  if (typeof additionalProperties != "undefined") {
    obj.additionalProperties = additionalProperties;
  }
}

function addNullableProp(obj, { nullable }) {
  if (typeof nullable != "undefined") {
    obj.nullable = nullable;
  }
}

function traverseSchema(schema, option) {
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  let newSchema = cloneDeep(schema);
  const PROPERTIES = "properties";
  const TYPE = "type";
  const ITEMS = "items";
  for (let prop in schema) {
    if (option.excludeList.includes(prop)) {
      delete newSchema[prop];
    } else {
      if (prop == TYPE && hasOwnProperty.call(schema, TYPE)) {
        addAdditionalProperties(newSchema, option);
        addNullableProp(newSchema, option);
      }

      if (prop === PROPERTIES && hasOwnProperty.call(schema, PROPERTIES)) {
        for (let eachProp in schema[PROPERTIES]) {
          if (hasOwnProperty.call(schema[PROPERTIES], eachProp)) {
            if (
              hasOwnProperty.call(schema[PROPERTIES][eachProp], PROPERTIES) ||
              hasOwnProperty.call(schema[PROPERTIES][eachProp], ITEMS)
            ) {
              newSchema[PROPERTIES][eachProp] = traverseSchema(
                schema[PROPERTIES][eachProp],
                option
              );
              continue;
            }

            if (hasOwnProperty.call(schema[PROPERTIES][eachProp], TYPE)) {
              if (option.nullable && newSchema[PROPERTIES][eachProp]["enum"]) {
                newSchema[PROPERTIES][eachProp]["enum"].push(null);
              }
              addNullableProp(newSchema[PROPERTIES][eachProp], option);
              addAdditionalProperties(newSchema[PROPERTIES][eachProp], option);
            }
          }
        }
      } else if (prop == ITEMS && hasOwnProperty.call(schema, ITEMS)) {
        newSchema[ITEMS] = traverseSchema(schema[ITEMS], option);
      }
    }
  }

  return newSchema;
}

function getRequestBodySchemaForOpenApiRV({
  parsedSpec,
  path,
  method,
  requestBodyContentType,
}) {
  const schema =
    parsedSpec.paths[path][method].requestBody.content[requestBodyContentType]
      .schema;

  const option = {
    nullable: false,
    additionalProperties: false,
    excludeList: ["x-swagger-router-model", "xml"],
  };
  const newSchema = traverseSchema(schema, option);
  // console.log(JSON.stringify(newSchema));
  return newSchema;
}

async function getRequestValidator({
  path,
  method,
  specJson,
  requestBodyContentType,
}) {
  const parsedSpec = await SwaggerParser.validate(specJson);
  const parsedSpecCopy = cloneDeep(parsedSpec);
  const opt = {
    parsedSpec: parsedSpecCopy,
    path,
    method,
    requestBodyContentType,
  };
  const customOption = {
    parameters: getParametersForOpenApiRV(opt),
    // will provide ref (actual schema is provided in schemas:RequestBody)
    requestBody: requestBodyContentType ? getRequestBodyForOpenApiRV(opt) : {},
    schemas: requestBodyContentType
      ? {
          RequestBody: getRequestBodySchemaForOpenApiRV(opt),
        }
      : {},
    errorTransformer: (_, jsonSchemaError) => {
      if (jsonSchemaError.instancePath.startsWith("/body")) {
        jsonSchemaError.instancePath = jsonSchemaError.instancePath.slice(5);
        if (jsonSchemaError.instancePath == "") {
          jsonSchemaError.instancePath = "/";
        }
      }

      jsonSchemaError.customMessage = `ERROR - Path: '${jsonSchemaError.instancePath}' `;

      switch (jsonSchemaError.keyword) {
        case "type":
          jsonSchemaError.customMessage += `${jsonSchemaError.message}`;
          break;

        case "required":
          jsonSchemaError.customMessage += `has missing required properties: '${jsonSchemaError.params.missingProperty}'`;
          break;

        case "additionalProperties":
          jsonSchemaError.customMessage += `has properties which are not allowed by the schema: '${jsonSchemaError.params.additionalProperty}'`;
          break;

        default:
          break;
      }

      console.log({
        jsonSchemaError,
      });
      return jsonSchemaError;
    },
    ajvOptions: {
      allErrors: true,
      coerceTypes: true,
    },
  };

  return new OpenAPIRequestValidator(customOption);
}

async function validate(specObj, request) {
  const requestValidator = await getRequestValidator(specObj);

  const errors = requestValidator.validateRequest(request);
  return errors;
}

module.exports = validate;
