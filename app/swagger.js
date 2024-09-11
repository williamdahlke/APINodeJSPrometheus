const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerOptions = require('../swagger.json')

module.exports = (app) => {
  app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerJsDoc(swaggerOptions)));
};
