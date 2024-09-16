import express, { Application } from 'express';
import userRoutes from './routes/routes';
import swaggerSetup from '../swagger';

const app: Application = express();

app.use(express.json());
app.use('/api', userRoutes);
swaggerSetup(app);

const PORT = 3031;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/api`);
});
