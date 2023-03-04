module.exports = {
  "x-swagger-router-model": "io.swagger.petstore.model.Pet",
  required: ["name", "photoUrls"],
  properties: {
    id: { type: "integer", format: "int64", example: 10 },
    name: { type: "string", example: "doggie" },
    category: {
      "x-swagger-router-model": "io.swagger.petstore.model.Category",
      properties: {
        id: { type: "integer", format: "int64", example: 1 },
        name: { type: "string", example: "Dogs" },
      },
      xml: { name: "category" },
      type: "object",
    },
    photoUrls: {
      type: "array",
      xml: { wrapped: true },
      items: { type: "string", xml: { name: "photoUrl" } },
    },
    tags: {
      type: "array",
      xml: { wrapped: true },
      items: {
        xml: { name: "tag" },
        "x-swagger-router-model": "io.swagger.petstore.model.Tag",
        properties: {
          id: { type: "integer", format: "int64" },
          name: { type: "string" },
        },
        type: "object",
      },
    },
    status: {
      type: "string",
      description: "pet status in the store",
      enum: ["available", "pending", "sold"],
    },
  },
  xml: { name: "pet" },
  type: "object",
};
