import express, { Application } from 'express';
import userRoutes from './routes/routes';
import swaggerSetup from '../swagger';
import cors from 'cors';

const app: Application = express();

app.use(express.json());

/*app.use(cors({
    origin: 'http://localhost:3000', // origem permitida (pode ser frontend em React, por exemplo)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));*/
app.use(cors());

app.use((req, res, next) => {
    if (req.path === '/') {
        res.redirect('/api');
    } else {
        next();
    }
});
app.use('/api', userRoutes);
swaggerSetup(app);

const PORT = 3031;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/api`);
});
