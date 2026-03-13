export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "AdaMenu API",
    version: "2.0.0",
    description: "Menu template publishing API for ADA Menu Builder",
  },
  servers: [
    { url: "https://api-menu.adasystems.app", description: "Production" },
    { url: "http://localhost:3002", description: "Local development" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "AdaAuth access token",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
        },
      },
      Restaurant: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          slug: { type: "string" },
          name: { type: "string" },
          role: { type: "string" },
        },
      },
      PublishStatus: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            is_default: { type: "boolean" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
      },
      BuiltInTemplate: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          thumbnail: { type: "string", nullable: true },
          format: { type: "object", properties: { type: { type: "string" }, width: { type: "number" }, height: { type: "number" } } },
          orientation: { type: "string", enum: ["portrait", "landscape"] },
          colors: { type: "object" },
          fonts: { type: "object" },
          spacing: { type: "object" },
          page_variants: { type: "array", items: { type: "object" } },
          version: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      MenuTemplate: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          restaurant_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          thumbnail: { type: "string", nullable: true },
          project_json: { type: "object" },
          is_default: { type: "boolean" },
          published_by: { type: "string", format: "uuid", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        security: [],
        responses: {
          "200": {
            description: "Service status",
            content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, service: { type: "string" }, version: { type: "string" }, uptime: { type: "integer" } } } } },
          },
        },
      },
    },
    "/api/v1/restaurants": {
      get: {
        tags: ["Restaurants"],
        summary: "List user's restaurants",
        description: "Fetches restaurants from AdaAuth profile for the authenticated user.",
        responses: {
          "200": {
            description: "List of restaurants",
            content: { "application/json": { schema: { type: "object", properties: { restaurants: { type: "array", items: { $ref: "#/components/schemas/Restaurant" } } } } } },
          },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/templates/publish-status": {
      get: {
        tags: ["Templates"],
        summary: "Get publish status for a template",
        description: "Returns which restaurants have this template published and their default status.",
        parameters: [
          { name: "name", in: "query", required: true, schema: { type: "string" }, description: "Template name" },
        ],
        responses: {
          "200": {
            description: "Publish status keyed by restaurant ID",
            content: { "application/json": { schema: { type: "object", properties: { status: { $ref: "#/components/schemas/PublishStatus" } } } } },
          },
          "400": { description: "Missing name param", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/built-in-templates": {
      get: {
        tags: ["Built-in Templates"],
        summary: "List all built-in templates",
        responses: {
          "200": {
            description: "List of built-in templates",
            content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/BuiltInTemplate" } } } } } },
          },
        },
      },
    },
    "/api/v1/built-in-templates/{id}": {
      get: {
        tags: ["Built-in Templates"],
        summary: "Get a built-in template",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Template data", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/BuiltInTemplate" } } } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Built-in Templates"],
        summary: "Update a built-in template (admin only)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, format: { type: "object" }, orientation: { type: "string" }, colors: { type: "object" }, fonts: { type: "object" }, spacing: { type: "object" }, page_variants: { type: "array", items: { type: "object" } } } } } },
        },
        responses: {
          "200": { description: "Updated template", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/BuiltInTemplate" } } } } } },
          "403": { description: "Admin required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/restaurants/{restaurantId}/templates": {
      get: {
        tags: ["Restaurant Templates"],
        summary: "List templates for a restaurant",
        parameters: [{ name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "List of templates", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/MenuTemplate" } } } } } } },
        },
      },
      post: {
        tags: ["Restaurant Templates"],
        summary: "Publish a template to a restaurant (admin only)",
        parameters: [{ name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["name", "project_json"], properties: { name: { type: "string" }, description: { type: "string" }, thumbnail: { type: "string" }, project_json: { type: "object" }, is_default: { type: "boolean" }, published_by: { type: "string", format: "uuid" } } } } },
        },
        responses: {
          "201": { description: "Created template", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/MenuTemplate" } } } } } },
          "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Admin required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/restaurants/{restaurantId}/templates/default": {
      get: {
        tags: ["Restaurant Templates"],
        summary: "Get the default template for a restaurant",
        parameters: [{ name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Default template", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/MenuTemplate" } } } } } },
          "404": { description: "No default template", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/restaurants/{restaurantId}/templates/{id}": {
      get: {
        tags: ["Restaurant Templates"],
        summary: "Get a specific template",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Template data", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/MenuTemplate" } } } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Restaurant Templates"],
        summary: "Update a published template (admin only)",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, thumbnail: { type: "string" }, project_json: { type: "object" }, is_default: { type: "boolean" } } } } },
        },
        responses: {
          "200": { description: "Updated template", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/MenuTemplate" } } } } } },
          "403": { description: "Admin required" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["Restaurant Templates"],
        summary: "Delete (unpublish) a template (admin only)",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Deleted" },
          "403": { description: "Admin required" },
        },
      },
    },
    "/api/v1/restaurants/{restaurantId}/templates/{id}/set-default": {
      patch: {
        tags: ["Restaurant Templates"],
        summary: "Set a template as default for a restaurant (admin only)",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Updated template", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/MenuTemplate" } } } } } },
          "403": { description: "Admin required" },
          "404": { description: "Not found" },
        },
      },
    },
  },
};
