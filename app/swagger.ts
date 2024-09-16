import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';
import swaggerJsdoc from 'swagger-jsdoc';

const specs = swaggerJsdoc(swaggerDocument);

const swaggerSetup = (app: Application): void => {
  app.use('/api', swaggerUi.serve, swaggerUi.setup(specs));
};

export default swaggerSetup;