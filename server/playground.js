const Ajv = require("ajv");
const cloneDeep = require("lodash.clonedeep");
const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}

const schema = require("./spec.js");
function addAdditionalProperties(obj, { additionalProperties }) {
  if (additionalProperties) {
    obj.additionalProperties = additionalProperties;
  }
}

function addNullableProp(obj, { nullable }) {
  if (nullable) {
    obj.nullable = nullable;
  }
}

function traverseSchema(schema, option) {
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const newSchema = cloneDeep(schema);
  const PROPERTIES = "properties";
  const TYPE = "type";
  const ITEMS = "items";
  for (let prop in schema) {
    if (option.excludeList.includes(prop)) {
      delete newSchema[prop];
    } else {
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

            if (option.nullable && newSchema[PROPERTIES][eachProp]["enum"]) {
              newSchema[PROPERTIES][eachProp]["enum"].push(null);
            }
            addNullableProp(newSchema[PROPERTIES][eachProp], option);
            addAdditionalProperties(newSchema[PROPERTIES][eachProp], option);
          }
        }
      } else if (prop == ITEMS && hasOwnProperty.call(schema, ITEMS)) {
        newSchema[ITEMS] = traverseSchema(schema[ITEMS], option);
      }
    }
  }

  if (hasOwnProperty.call(schema, TYPE)) {
    addAdditionalProperties(newSchema, option);
    addNullableProp(newSchema, option);
  }

  return newSchema;
}

const newSchema = traverseSchema(schema, {
  nullable: true,
  excludeList: ["x-swagger-router-model", "xml"],
});

console.log(JSON.stringify(schema));
console.log("-----------");
console.log(newSchema);
console.log("-----------");
console.log(JSON.stringify(newSchema));
console.log("-----------");
// const validate = ajv.compile(schema);

// const data = {
//   foo: 1,
//   bar: "abc",
// };

// const valid = validate(data);
// if (!valid) console.log(validate.errors);
// console.log(valid);
