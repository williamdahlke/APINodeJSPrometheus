import { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';

dotenv.config();
const API_KEY = process.env.API_KEY;

export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    let apiKey : string | undefined = req.headers['authorization'];
    apiKey = apiKey?.slice(7);
    if (apiKey === API_KEY) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
};