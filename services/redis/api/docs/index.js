const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
