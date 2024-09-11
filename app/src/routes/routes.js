const express = require('express');
const router = express.Router();
let prom = require('prom-client');
let register = prom.register;

const usuariosOnline = new prom.Gauge({
    name: 'gis_usuarios_online_total',
    help: 'Número de usuários logados no momento'
});

/**
 * @swagger
 * components:
 *     Metric:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the metric
 *         value:
 *           type: number
 *           description: The value of the metric
 *       example:
 *         name: gis_usuarios_online_total
 *         value: 5
 */

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Retrieve a list of metrics
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: A list of metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/Metric'
 */

router.get('/metrics', async function (req, res) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
})

/**
 * @swagger
 * /api/metrics/insert:
 *   post:
 *     summary: Insert a new metric value
 *     tags: [Metrics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *                 description: The value to increment the metric by
 *             example:
 *               value: 1
 *     responses:
 *       200:
 *         description: Metric incremented successfully
 *       400:
 *         description: Invalid value
 */
router.post('/metrics/insert', function (req, res) {
    const incrementValue = req.body.value;
    if (typeof incrementValue === 'number') {
        usuariosOnline.inc(incrementValue);
        res.status(200).send(`Incremented by ${incrementValue}`);
    } else {
        res.status(400).send('Invalid value');
    }
});

module.exports = router;