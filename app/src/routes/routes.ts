import express, { Request, Response } from 'express';
import { isValidJson } from '../validate';
import { MetricsController } from '../controllers/MetricsController';
import { GaugeMetric, HistogramMetric, Label, WegUser } from '../models';

const router = express.Router();
const metricsController = new MetricsController();

/**
 * @swagger
 * tags:
 *  - name: Metrics
 *    description: Operations to get and set metrics
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
 */
router.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', await metricsController.getContentType());
  res.end(await metricsController.getMetrics());
});

/**
 * @swagger
 * /api/metrics/insert/gauge:
 *  post:
 *    summary: Post metrics to integrate with prometheus
 *    tags: [Metrics]
 *    requestBody:
 *      required: true
 *      content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               MetricName:
 *                 type: string
 *               Help:
 *                 type: string
 *               Type:
 *                 type: integer
 *               Operation:
 *                 type: integer
 *               Label:
 *                type: object
 *                properties:
 *                  LabelNames:
 *                    type: array
 *                    items:
 *                      type: string
 *                  LabelValues:
 *                    type: array
 *                    items:
 *                      type: string
 *               User:
 *                 type: object
 *                 properties:
 *                  Name:
 *                    type: string
 *                  Unity:
 *                    type: string
 *             example:
 *               MetricName: gis_usuarios_online_total
 *               Help: Número de usuários logados no momento
 *               Type: 2
 *               Operation: 1
 *               Label:
 *                LabelNames: ["unity"]
 *                LabelValues: ["WTD-BNU"]
 *               User:
 *                Name: williamgd
 *                Unity: WTD-BNU
 *    responses:
 *      201:
 *        description: Metrics registered successfully
 *      400:
 *        description: An error occurred or JSON is invalid
 */
router.post('/metrics/insert/gauge', (req: Request, res: Response) => {

  if (!isValidJson(req.body)) {
    return res.status(400).send("JSON is not valid.");
  }
  
  const gaugeMetric : GaugeMetric = req.body;
  gaugeMetric.User = new WegUser(req.body.User.Name, req.body.User.Unity); 
  gaugeMetric.Label = new Label(req.body.Label.LabelNames, req.body.Label.LabelValues);
  
  metricsController.insertGauge(gaugeMetric);
  res.status(201).send();
});

/**
 * @swagger
 * /api/metrics/insert/histogram:
 *  post:
 *    summary: Post metrics to integrate with prometheus
 *    tags: [Metrics]
 *    requestBody:
 *      required: true
 *      content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               MetricName:
 *                 type: string
 *               Help:
 *                 type: string                               
 *               Type:
 *                 type: integer
 *               Buckets:
 *                 type: array
 *                 items:
 *                  type: integer
 *               Label:
 *                type: object
 *                properties:
 *                  LabelNames:
 *                    type: array
 *                    items:
 *                      type: string
 *                  LabelValues:
 *                    type: array
 *                    items:
 *                      type: string
 *               ElapsedTimeMs:
 *                 type: long
 *               User:
 *                 type: object
 *                 properties:
 *                  Name:
 *                    type: string
 *                  Unity:
 *                    type: string
 *             example:
 *               MetricName: gis_tempo_op_sap_segundos
 *               Help: Tempo em segundos que o GIS levou para realizar as integrações com o SAP
 *               Type: 3   
 *               Buckets: [100,300,500,800,1000,3000,5000,8000,10000]
 *               Label:
 *                LabelNames: ["operation"]
 *                LabelValues: ["Checkin"]
 *               ElapsedTimeMs: 1155
 *               User:
 *                Name: williamgd
 *                Unity: WTD-BNU
 *    responses:
 *      201:
 *        description: Metrics registered successfully
 *      400:
 *        description: An error occurred or JSON is invalid
 */

router.post('/metrics/insert/histogram', (req: Request, res: Response) => {

  if (!isValidJson(req.body)) {
    return res.status(400).send("JSON is not valid.");
  }
  
  const histogramMetric : HistogramMetric = req.body;
  histogramMetric.User = new WegUser(req.body.User.Name, req.body.User.Unity);     
  histogramMetric.Label = new Label(req.body.Label.LabelNames, req.body.Label.LabelValues);  
  metricsController.insertHistogram(histogramMetric);
  res.status(201).send();
});

export default router;
