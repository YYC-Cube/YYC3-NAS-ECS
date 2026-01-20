const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RediOps API',
      version: '1.0.0',
      description: '由言语团队运营，备案邮箱：admin@0379.email'
    }
  },
  apis: ['./routes/*.js']
};

module.exports = swaggerJSDoc(options);
