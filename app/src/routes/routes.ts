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
 * /api/metrics/insert:
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
 *               Type:
 *                 type: integer
 *               Operation:
 *                 type: integer
 *               Labels:
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
 *               Type: 2
 *               Operation: 1
 *               Labels: ["WTD_BNU"]
 *               User:
 *                Name: williamgd
 *                Unity: WTD_BNU
 *    responses:
 *      201:
 *        description: Metrics registered successfully
 *      400:
 *        description: An error occurred or JSON is invalid
 */
router.post('/metrics/insert', (req: Request, res: Response) => {

  if (!isValidJson(req.body)) {
    return res.status(400).send("JSON is not valid.");
  }
  
  switch (req.body.Type ){
    case 2:
      const gaugeMetric : GaugeMetric = req.body;
      gaugeMetric.User = new WegUser(req.body.User.Name, req.body.User.Unity); 
      setGaugeMetric(gaugeMetric);
      break;

    case 3:
      const histogramMetric : HistogramMetric = req.body;
      histogramMetric.User = new WegUser(req.body.User.Name, req.body.User.Unity);     
      setHistogramMetric(histogramMetric);
      break;

    default:
      return res.status(400).send("Metric type isn't registered.");      
  }
  res.status(201).send();
});

function setGaugeMetric(metric: GaugeMetric) {
  addUpdateGauge(metric);
  setActiveUserGaugeMetric(metric);
}

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
