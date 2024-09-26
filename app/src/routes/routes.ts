import express, { Request, Response } from 'express';
import prom from 'prom-client';
import { GaugeMetric, HistogramMetric, Metric, WegUser } from '../models';
import { activeUsers, addUpdateGauge, addUpdateHistogram } from '../metrics';
import { GroupedUsers } from '../interfaces';
import { isValidJson } from '../validate';

const router = express.Router();
const register = prom.register;

let activeUsersArray: WegUser[] = [];

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
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
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
 *               LabelNames:
 *                 type: array
 *                 items:
 *                  type: string
 *               LabelValues:
 *                 type: array
 *                 items:
 *                  type: string
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
 *               LabelNames: ["unity"]
 *               LabelValues: ["WTD-BNU"]
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
  setGaugeMetric(gaugeMetric);
  res.status(201).send();
});

function setGaugeMetric(metric: GaugeMetric) {
  addUpdateGauge(metric);
  setActiveUserGaugeMetric(metric);
}

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
 *               LabelNames:
 *                 type: array
 *                 items:
 *                  type: string
 *               LabelValues:
 *                 type: array
 *                 items:
 *                  type: string
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
 *               LabelNames: ["operation"]
 *               LabelValues: ["Checkin"]
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
  setHistogramMetric(histogramMetric);
  res.status(201).send();
});

function setHistogramMetric(metric: HistogramMetric) {
  addUpdateHistogram(metric);
  setActiveUserGaugeMetric(metric);
}

function setActiveUserGaugeMetric(metric: Metric) {
  const selectedUser = activeUsersArray.find(x => x.Name == metric.User!.Name && x.Unity == metric.User!.Unity);
  if (selectedUser == undefined) activeUsersArray.push(metric.User!);

  filterActiveUsersByTime();
  let groupedUsersArray = groupActiveUsersByUnity();
  setActiveUsersMetricValue(groupedUsersArray);
}

function filterActiveUsersByTime() {
  let filtroData = new Date();
  filtroData.setDate(filtroData.getDate() - 90);
  activeUsersArray = activeUsersArray.filter((x) => x.LastOpened >= filtroData.getTime());
}

function groupActiveUsersByUnity() {
  let groupedUsers = groupByUnity(activeUsersArray);
  let groupedUsersArray = Object.values(groupedUsers);
  return groupedUsersArray;
}

// Função para agrupar usuários pela propriedade 'unity' e contar o total de usuários por unidade
function groupByUnity(users: WegUser[]): GroupedUsers {
  return users.reduce((groups: GroupedUsers, user: WegUser) => {
      const unity = user.Unity;
      if (!groups[unity]) {
          groups[unity] = { unity: unity, totalUsers: 0 };
      }
      groups[unity].totalUsers++;
      return groups;
  }, {});
}

function setActiveUsersMetricValue(groupedUsersArray: { unity: string; totalUsers: number; }[]) {
  activeUsers.reset();
  groupedUsersArray.forEach((item) => {
    activeUsers.labels(item.unity).inc(item.totalUsers);
  });
}

export default router;
