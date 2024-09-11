const express = require('express');
const app = express();
const swaggerSetup = require('../swagger');
const userRoutes = require('./routes/routes')

app.use(express.json());
app.use('/api', userRoutes);
swaggerSetup(app);

app.listen(3031, () => {
    console.log('Server is running on http://localhost:3031/api')
});