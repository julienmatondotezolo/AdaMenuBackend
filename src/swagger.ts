export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "AdaMenu API",
    version: "2.0.0",
    description: "Menu template publishing API for ADA Menu Builder",
  },
  servers: [
    { url: "https://api-menu.adasystems.app", description: "Production" },
    { url: "http://localhost:5006", description: "Local development" },
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
          role: { type: "string", enum: ["admin", "owner", "manager", "staff"] },
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
      Menu: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          restaurant_id: { type: "string", format: "uuid" },
          title: { type: "string" },
          subtitle: { type: "string", nullable: true },
          template_id: { type: "string", format: "uuid", nullable: true },
          status: { type: "string", enum: ["draft", "published"] },
          disabled: { type: "boolean" },
          thumbnail: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      LocalizedName: {
        type: "object",
        properties: {
          language: { type: "string", example: "en" },
          name: { type: "string" },
        },
        required: ["language", "name"],
      },
      LocalizedDescription: {
        type: "object",
        properties: {
          language: { type: "string", example: "en" },
          description: { type: "string" },
        },
        required: ["language", "description"],
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          menu_id: { type: "string", format: "uuid" },
          restaurant_id: { type: "string", format: "uuid" },
          parent_category_id: { type: "string", format: "uuid", nullable: true },
          hidden: { type: "boolean" },
          display_order: { type: "integer" },
          menu_category_names: { type: "array", items: { $ref: "#/components/schemas/LocalizedName" } },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      MenuItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          menu_id: { type: "string", format: "uuid" },
          restaurant_id: { type: "string", format: "uuid" },
          category_id: { type: "string", format: "uuid" },
          price: { type: "number" },
          image_url: { type: "string", nullable: true },
          hidden: { type: "boolean" },
          featured: { type: "boolean" },
          display_order: { type: "integer" },
          menu_builder_item_names: { type: "array", items: { $ref: "#/components/schemas/LocalizedName" } },
          menu_builder_item_descriptions: { type: "array", items: { $ref: "#/components/schemas/LocalizedDescription" } },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      MenuPage: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          menu_id: { type: "string", format: "uuid" },
          variant_id: { type: "string" },
          category_ids: { type: "array", items: { type: "string" } },
          sort_order: { type: "integer" },
        },
      },
      PublishedMenu: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          restaurant_id: { type: "string", format: "uuid" },
          title: { type: "string" },
          menu_data: { type: "object" },
          template_data: { type: "object" },
          published_by: { type: "string", format: "uuid", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      AiAction: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["create_category", "update_category", "delete_category", "create_item", "update_item", "delete_item", "update_menu"] },
        },
        additionalProperties: true,
      },
      ChatMessage: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          menu_id: { type: "string", format: "uuid" },
          role: { type: "string", enum: ["user", "assistant"] },
          content: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    // ═══════════════════════════════════════════════════════════════════════════
    // SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════════════
    // RESTAURANTS
    // ═══════════════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════════════
    // TEMPLATE PUBLISH STATUS
    // ═══════════════════════════════════════════════════════════════════════════
    "/api/v1/templates/publish-status": {
      get: {
        tags: ["Templates"],
        summary: "Get publish status for a template by name",
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

    // ═══════════════════════════════════════════════════════════════════════════
    // BUILT-IN TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════════
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
          content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, thumbnail: { type: "string" }, format: { type: "object" }, orientation: { type: "string" }, colors: { type: "object" }, fonts: { type: "object" }, spacing: { type: "object" }, page_variants: { type: "array", items: { type: "object" } } } } } },
        },
        responses: {
          "200": { description: "Updated template", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/BuiltInTemplate" } } } } } },
          "403": { description: "Admin required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // RESTAURANT TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════════════
    // MENUS — CRUD
    // ═══════════════════════════════════════════════════════════════════════════
    "/api/v1/restaurants/{restaurantId}/menus": {
      post: {
        tags: ["Menus"],
        summary: "Create a menu",
        parameters: [{ name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["title"], properties: { title: { type: "string" }, subtitle: { type: "string" }, template_id: { type: "string", format: "uuid" }, status: { type: "string", enum: ["draft", "published"], default: "draft" } } } } },
        },
        responses: {
          "201": { description: "Created menu", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Menu" } } } } } },
          "400": { description: "Missing title", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      get: {
        tags: ["Menus"],
        summary: "List menus for a restaurant",
        description: "Non-admin users will not see disabled menus.",
        parameters: [{ name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "List of menus", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Menu" } } } } } } },
        },
      },
    },
    "/api/v1/restaurants/{restaurantId}/menus/{menuId}": {
      get: {
        tags: ["Menus"],
        summary: "Get a single menu",
        description: "Non-admin users cannot see disabled menus.",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Menu data", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Menu" } } } } } },
          "403": { description: "Menu is disabled", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Menus"],
        summary: "Update menu metadata",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, subtitle: { type: "string" }, template_id: { type: "string", format: "uuid" }, status: { type: "string", enum: ["draft", "published"] } } } } },
        },
        responses: {
          "200": { description: "Updated menu", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Menu" } } } } } },
          "400": { description: "No fields to update", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Menus"],
        summary: "Hard delete a menu (admin only)",
        description: "Permanently deletes the menu and all its content via CASCADE.",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Deleted" },
          "403": { description: "Admin required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/restaurants/{restaurantId}/menus/{menuId}/complete": {
      get: {
        tags: ["Menus"],
        summary: "Get full nested menu with categories, items, and pages",
        description: "Returns fully normalized nested structure with subcategories, item names, descriptions, allergens, side dishes, and supplements.",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "Complete menu data",
            content: { "application/json": { schema: { type: "object", properties: { data: { type: "object", properties: { id: { type: "string", format: "uuid" }, title: { type: "string" }, categories: { type: "array", items: { type: "object" } }, pages: { type: "array", items: { $ref: "#/components/schemas/MenuPage" } } } } } } } },
          },
          "403": { description: "Menu is disabled", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/restaurants/{restaurantId}/menus/{menuId}/disable": {
      patch: {
        tags: ["Menus"],
        summary: "Soft-delete a menu",
        description: "Sets disabled=true on the menu. Any user with access can soft-delete.",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Disabled menu", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Menu" } } } } } },
        },
      },
    },
    "/api/v1/restaurants/{restaurantId}/menus/{menuId}/enable": {
      patch: {
        tags: ["Menus"],
        summary: "Re-enable a disabled menu (admin only)",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Enabled menu", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Menu" } } } } } },
          "403": { description: "Admin required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATEGORIES — scoped to a menu
    // ═══════════════════════════════════════════════════════════════════════════
    "/api/v1/restaurants/{restaurantId}/menus/{menuId}/categories": {
      post: {
        tags: ["Categories"],
        summary: "Create a category",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["names"],
                properties: {
                  names: { type: "array", items: { $ref: "#/components/schemas/LocalizedName" }, description: "At least one localized name" },
                  parent_category_id: { type: "string", format: "uuid", nullable: true },
                  hidden: { type: "boolean", default: false },
                  display_order: { type: "integer", default: 0 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created category with names", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Category" } } } } } },
          "400": { description: "Missing names array", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      get: {
        tags: ["Categories"],
        summary: "List categories for a menu",
        description: "Ordered by display_order ascending.",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "List of categories with names", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Category" } } } } } } },
        },
      },
    },
    "/api/v1/restaurants/{restaurantId}/menus/{menuId}/categories/{catId}": {
      patch: {
        tags: ["Categories"],
        summary: "Update a category",
        description: "Supports updating names, hidden status, display_order, and parent_category_id for subcategory hierarchy.",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "catId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  names: { type: "array", items: { $ref: "#/components/schemas/LocalizedName" } },
                  hidden: { type: "boolean" },
                  display_order: { type: "integer" },
                  parent_category_id: { type: "string", format: "uuid", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated category", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Category" } } } } } },
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete a category",
        description: "CASCADE handles items, names, and subcategories.",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "catId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MENU ITEMS — scoped to a category within a menu
    // ═══════════════════════════════════════════════════════════════════════════
    "/api/v1/restaurants/{restaurantId}/menus/{menuId}/categories/{catId}/items": {
      post: {
        tags: ["Menu Items"],
        summary: "Create a menu item",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "catId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["names"],
                properties: {
                  names: { type: "array", items: { $ref: "#/components/schemas/LocalizedName" } },
                  descriptions: { type: "array", items: { $ref: "#/components/schemas/LocalizedDescription" } },
                  price: { type: "number", default: 0 },
                  hidden: { type: "boolean", default: false },
                  display_order: { type: "integer", default: 0 },
                  featured: { type: "boolean", default: false },
                  image_url: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created item with names and descriptions", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/MenuItem" } } } } } },
          "400": { description: "Missing names array", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/restaurants/{restaurantId}/menus/{menuId}/items/{itemId}": {
      patch: {
        tags: ["Menu Items"],
        summary: "Update a menu item",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "itemId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  names: { type: "array", items: { $ref: "#/components/schemas/LocalizedName" } },
                  descriptions: { type: "array", items: { $ref: "#/components/schemas/LocalizedDescription" } },
                  price: { type: "number" },
                  hidden: { type: "boolean" },
                  display_order: { type: "integer" },
                  featured: { type: "boolean" },
                  category_id: { type: "string", format: "uuid", description: "Move item to a different category" },
                  image_url: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated item", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/MenuItem" } } } } } },
        },
      },
      delete: {
        tags: ["Menu Items"],
        summary: "Delete a menu item",
        description: "CASCADE handles names, descriptions, allergens, side dishes, and supplements.",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "itemId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Deleted" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MENU PAGES — layout pages
    // ═══════════════════════════════════════════════════════════════════════════
    "/api/v1/restaurants/{restaurantId}/menus/{menuId}/pages": {
      put: {
        tags: ["Menu Pages"],
        summary: "Save/replace all pages for a menu",
        description: "Deletes all existing pages and inserts the new set. Used to persist page layout.",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["pages"],
                properties: {
                  pages: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["variant_id"],
                      properties: {
                        variant_id: { type: "string" },
                        category_ids: { type: "array", items: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Saved pages", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/MenuPage" } } } } } } },
          "400": { description: "Missing pages array", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // BULK PUBLISH
    // ═══════════════════════════════════════════════════════════════════════════
    "/api/v1/restaurants/{restaurantId}/menus/{menuId}/bulk": {
      put: {
        tags: ["Menus"],
        summary: "Atomic bulk replace all menu content",
        description: "Replaces all categories, items, and pages in a single request. Returns a mapping of local IDs to backend IDs for frontend state sync.",
        parameters: [
          { name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["categories"],
                properties: {
                  title: { type: "string" },
                  subtitle: { type: "string" },
                  template_id: { type: "string", format: "uuid" },
                  status: { type: "string" },
                  thumbnail: { type: "string" },
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "Local/frontend ID for mapping" },
                        name: { type: "string" },
                        names: { type: "array", items: { $ref: "#/components/schemas/LocalizedName" } },
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              names: { type: "array", items: { $ref: "#/components/schemas/LocalizedName" } },
                              descriptions: { type: "array", items: { $ref: "#/components/schemas/LocalizedDescription" } },
                              price: { type: "number" },
                              featured: { type: "boolean" },
                              hidden: { type: "boolean" },
                              image_url: { type: "string", nullable: true },
                            },
                          },
                        },
                      },
                    },
                  },
                  pages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        variant_id: { type: "string" },
                        category_ids: { type: "array", items: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Category ID mapping (local to backend)",
            content: { "application/json": { schema: { type: "object", properties: { data: { type: "object", properties: { categoryIdMap: { type: "object", additionalProperties: { type: "string" } } } } } } } },
          },
          "400": { description: "Missing categories array", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLISHED MENUS — QR code publishing (auth required)
    // ═══════════════════════════════════════════════════════════════════════════
    "/api/v1/menus/publish": {
      post: {
        tags: ["Published Menus"],
        summary: "Publish a menu for QR code access",
        description: "Stores a snapshot of menu data + template design. Upserts if already published.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["menu_id", "restaurant_id", "title", "menu_data", "template_data"],
                properties: {
                  menu_id: { type: "string", format: "uuid" },
                  restaurant_id: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  menu_data: { type: "object", description: "Full menu data snapshot (categories, items, etc.)" },
                  template_data: { type: "object", description: "Template design snapshot (colors, fonts, layout)" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Published menu", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/PublishedMenu" } } } } } },
          "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/menus/{menuId}/unpublish": {
      delete: {
        tags: ["Published Menus"],
        summary: "Unpublish a menu",
        description: "Removes the published menu snapshot so it's no longer accessible via QR code.",
        parameters: [{ name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "Unpublished" },
        },
      },
    },
    "/api/v1/menus/{menuId}/publish-status": {
      get: {
        tags: ["Published Menus"],
        summary: "Check if a menu is published",
        parameters: [{ name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Publish status",
            content: { "application/json": { schema: { type: "object", properties: { published: { type: "boolean" }, data: { $ref: "#/components/schemas/PublishedMenu" } } } } },
          },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC MENUS — QR code access (no auth)
    // ═══════════════════════════════════════════════════════════════════════════
    "/api/v1/public/menus/restaurant/{restaurantId}": {
      get: {
        tags: ["Public Menus"],
        summary: "Get the current menu for a restaurant (no auth required)",
        description: "Returns the most recently updated, non-disabled menu for a restaurant as an array of categories with nested items, subcategories, names, descriptions, allergens, side dishes, and supplements.",
        security: [],
        parameters: [{ name: "restaurantId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Current menu with categories and items",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        menu: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            title: { type: "string" },
                            subtitle: { type: "string", nullable: true },
                            status: { type: "string" },
                            updated_at: { type: "string", format: "date-time" },
                          },
                        },
                        categories: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string", format: "uuid" },
                              names: { type: "array", items: { $ref: "#/components/schemas/LocalizedName" } },
                              display_order: { type: "integer" },
                              items: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    id: { type: "string", format: "uuid" },
                                    price: { type: "number" },
                                    image_url: { type: "string", nullable: true },
                                    featured: { type: "boolean" },
                                    display_order: { type: "integer" },
                                    names: { type: "array", items: { $ref: "#/components/schemas/LocalizedName" } },
                                    descriptions: { type: "array", items: { $ref: "#/components/schemas/LocalizedDescription" } },
                                    allergen_ids: { type: "array", items: { type: "string", format: "uuid" } },
                                    side_dish_ids: { type: "array", items: { type: "string", format: "uuid" } },
                                    supplement_ids: { type: "array", items: { type: "string", format: "uuid" } },
                                  },
                                },
                              },
                              subcategories: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    id: { type: "string", format: "uuid" },
                                    names: { type: "array", items: { $ref: "#/components/schemas/LocalizedName" } },
                                    display_order: { type: "integer" },
                                    items: { type: "array", items: { type: "object" } },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": { description: "No active menu found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/public/menus/{menuId}": {
      get: {
        tags: ["Public Menus"],
        summary: "Get a published menu (no auth required)",
        description: "Public endpoint for QR code menu viewers. Returns the menu snapshot with template design.",
        security: [],
        parameters: [{ name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Published menu with template",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        menu: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            title: { type: "string" },
                            data: { type: "object" },
                            updatedAt: { type: "string", format: "date-time" },
                          },
                        },
                        template: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": { description: "Not found or not published", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // AI ASSISTANT
    // ═══════════════════════════════════════════════════════════════════════════
    "/api/v1/ai/menu-assist": {
      post: {
        tags: ["AI Assistant"],
        summary: "Chat with AI menu assistant",
        description: "Send a message with menu context. The AI returns a friendly message and a list of proposed actions (create/update/delete categories, items, menu metadata). Uses GPT-4o with JSON response format.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", description: "User's message" },
                  menuData: { type: "object", description: "Current menu state (categories, items)" },
                  menuId: { type: "string", format: "uuid", description: "Menu ID for chat persistence" },
                  pages: { type: "array", items: { type: "object" }, description: "Current page layout" },
                  chatHistory: {
                    type: "array",
                    description: "Previous chat messages with status (accepted/rejected/pending)",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string", enum: ["user", "assistant"] },
                        content: { type: "string" },
                        actions: { type: "array", items: { $ref: "#/components/schemas/AiAction" } },
                        status: { type: "string", enum: ["accepted", "rejected", "pending"] },
                      },
                    },
                  },
                  language: { type: "string", description: "Preferred response language (e.g. en, fr, nl)" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "AI response with proposed actions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", description: "Friendly description of proposed changes" },
                    actions: { type: "array", items: { $ref: "#/components/schemas/AiAction" }, description: "List of proposed menu modifications" },
                  },
                },
              },
            },
          },
          "400": { description: "Missing message", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "AI error or missing API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/ai/menu-assist/history/{menuId}": {
      get: {
        tags: ["AI Assistant"],
        summary: "Load chat history for a menu",
        parameters: [{ name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Chat messages", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/ChatMessage" } } } } } } },
        },
      },
      delete: {
        tags: ["AI Assistant"],
        summary: "Clear chat history for a menu",
        parameters: [{ name: "menuId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "Cleared" },
        },
      },
    },
  },
};
