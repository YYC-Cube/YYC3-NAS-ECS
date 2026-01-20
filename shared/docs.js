/**
 * @file 共享文档模块
 * @description 提供Swagger文档支持
 * @module shared/docs
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 */

// 基础Swagger文档配置
const swaggerDocs = {
  openapi: '3.0.1',
  info: {
    title: 'YYC³ API Documentation',
    description: 'YYC³ 服务API文档',
    version: process.env.VERSION || '1.0.0',
    contact: {
      name: 'YYC³ Team',
      email: 'admin@0379.email',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 6000}/api`,
      description: '本地开发服务器',
    },
    {
      url: `https://api.0379.email/api`,
      description: '生产服务器',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: '健康检查',
        description: '检查服务是否正常运行',
        responses: {
          200: {
            description: '服务正常',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'healthy',
                    },
                    timestamp: {
                      type: 'string',
                      example: '2025-01-30T12:00:00.000Z',
                    },
                    service: {
                      type: 'string',
                      example: 'api',
                    },
                    version: {
                      type: 'string',
                      example: '1.0.0',
                    },
                    hostname: {
                      type: 'string',
                      example: 'yyc3-server',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/status': {
      get: {
        summary: '获取服务状态',
        description: '获取服务的详细状态信息',
        responses: {
          200: {
            description: '服务状态信息',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'running',
                    },
                    timestamp: {
                      type: 'string',
                      example: '2025-01-30T12:00:00.000Z',
                    },
                    service: {
                      type: 'string',
                      example: 'api',
                    },
                    version: {
                      type: 'string',
                      example: '1.0.0',
                    },
                    hostname: {
                      type: 'string',
                      example: 'yyc3-server',
                    },
                    uptime: {
                      type: 'number',
                      example: 3600,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/version': {
      get: {
        summary: '获取版本信息',
        description: '获取服务的版本信息',
        responses: {
          200: {
            description: '版本信息',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    version: {
                      type: 'string',
                      example: '1.0.0',
                    },
                    service: {
                      type: 'string',
                      example: 'api',
                    },
                    timestamp: {
                      type: 'string',
                      example: '2025-01-30T12:00:00.000Z',
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
};

module.exports = swaggerDocs;