import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AdaMenu Backend API',
      version: '1.0.0',
      description: 'Restaurant menu management system API with multi-tenant support',
      contact: {
        name: 'AdaMenu Support',
        email: 'support@adamenu.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
      {
        url: 'https://ada.mindgen.app',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Restaurant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Restaurant unique identifier'
            },
            name: {
              type: 'string',
              description: 'Restaurant name'
            },
            slug: {
              type: 'string',
              description: 'URL-friendly restaurant identifier'
            },
            logo_url: {
              type: 'string',
              nullable: true,
              description: 'Restaurant logo URL'
            },
            primary_color: {
              type: 'string',
              description: 'Primary brand color (hex)',
              example: '#000000'
            },
            accent_color: {
              type: 'string', 
              description: 'Accent brand color (hex)',
              example: '#666666'
            },
            font_family: {
              type: 'string',
              description: 'Font family for menu display',
              example: 'Arial, sans-serif'
            },
            languages: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Supported languages',
              example: ['en', 'nl', 'fr']
            },
            default_language: {
              type: 'string',
              description: 'Default language',
              example: 'en'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Category unique identifier'
            },
            name: {
              type: 'object',
              description: 'Category name in multiple languages',
              example: {
                en: 'Appetizers',
                nl: 'Voorgerechten',
                fr: 'Entrées'
              }
            },
            icon: {
              type: 'string',
              nullable: true,
              description: 'Category icon identifier'
            },
            sort_order: {
              type: 'integer',
              description: 'Display order'
            },
            visible: {
              type: 'boolean',
              description: 'Whether category is visible in menu'
            },
            restaurant_id: {
              type: 'string',
              description: 'Associated restaurant ID'
            }
          }
        },
        MenuItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Menu item unique identifier'
            },
            name: {
              type: 'object',
              description: 'Item name in multiple languages'
            },
            description: {
              type: 'object',
              description: 'Item description in multiple languages'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Item price in euros'
            },
            image_url: {
              type: 'string',
              nullable: true,
              description: 'Item image URL'
            },
            available: {
              type: 'boolean',
              description: 'Whether item is available'
            },
            sort_order: {
              type: 'integer',
              description: 'Display order within subcategory'
            }
          }
        },
        Allergen: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            name: {
              type: 'string',
              description: 'Allergen name'
            },
            icon: {
              type: 'string',
              nullable: true,
              description: 'Allergen icon/symbol'
            }
          }
        },
        PublicMenu: {
          type: 'object',
          properties: {
            restaurant: {
              $ref: '#/components/schemas/Restaurant'
            },
            categories: {
              type: 'array',
              items: {
                allOf: [
                  { $ref: '#/components/schemas/Category' },
                  {
                    type: 'object',
                    properties: {
                      subcategories: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'object' },
                            sort_order: { type: 'integer' },
                            items: {
                              type: 'array',
                              items: {
                                allOf: [
                                  { $ref: '#/components/schemas/MenuItem' },
                                  {
                                    type: 'object',
                                    properties: {
                                      allergens: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Allergen' }
                                      },
                                      side_dishes: {
                                        type: 'array',
                                        items: { type: 'object' }
                                      },
                                      supplements: {
                                        type: 'array', 
                                        items: { type: 'object' }
                                      }
                                    }
                                  }
                                ]
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error code'
            },
            message: {
              type: 'string',
              description: 'Human-readable error message'
            }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok'
            },
            service: {
              type: 'string',
              example: 'adamenu-backend'
            },
            version: {
              type: 'string',
              example: '1.0.0'
            },
            uptime: {
              type: 'integer',
              description: 'Uptime in seconds'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'System health and status endpoints'
      },
      {
        name: 'Public Menu',
        description: 'Public menu endpoints for widgets and displays'
      },
      {
        name: 'Restaurants',
        description: 'Restaurant management (Admin)'
      },
      {
        name: 'Categories', 
        description: 'Category management (Admin)'
      },
      {
        name: 'Menu Items',
        description: 'Menu item management (Admin)'
      },
      {
        name: 'Allergens',
        description: 'Allergen management (Admin)'
      },
      {
        name: 'Legacy API',
        description: 'Legacy compatibility endpoints'
      },
      {
        name: 'AI Template',
        description: 'AI-powered menu template generation'
      }
    ]
  },
  apis: ['./src/index.ts', './src/routes/**/*.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI setup
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AdaMenu API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
    }
  }));

  // JSON endpoint for the swagger spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default specs;