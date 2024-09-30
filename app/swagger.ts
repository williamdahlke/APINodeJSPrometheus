import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './src/docs/swagger.json';

const swaggerSetup = (app: Application): void => {
  app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

export default swaggerSetup;