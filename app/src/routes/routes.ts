import express, { Request, Response } from 'express';
import prom from 'prom-client';
import { HistogramMetric, Metric, WegUser } from '../models';
import { activeInstances, timeToGenerateProj, timeOperationsSAP, timeToSaveProject, activeUsers } from '../metrics';
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
  
  let metric: Metric = req.body;
  metric.User = new WegUser(req.body.User.Name, req.body.User.Unity); 

  switch (metric.Type) {
    case 2:
      setGaugeMetric(metric);
      break;
    case 3:
      const histogramMetric : HistogramMetric = new HistogramMetric(metric);
      setHistogramMetric(histogramMetric);
      break;
    default:
      return res.status(400).send("Metric type isn't registered.");
  }
  setActiveUserGaugeMetric(metric);

  res.status(201).send();
});

function setActiveUserGaugeMetric(metric: Metric) {
  const selectedUser = activeUsersArray.find(x => x.Name == metric.User.Name && x.Unity == metric.User.Unity);
  if (selectedUser == undefined) activeUsersArray.push(metric.User);

  filterActiveUsersByTime();
  let groupedUsersArray = groupActiveUsersByUnity();
  setActiveUsersMetricValue(groupedUsersArray);
}

function setActiveUsersMetricValue(groupedUsersArray: { unity: string; totalUsers: number; }[]) {
  activeUsers.reset();
  groupedUsersArray.forEach((item) => {
    activeUsers.labels(item.unity).inc(item.totalUsers);
  });
}

function groupActiveUsersByUnity() {
  let groupedUsers = groupByUnity(activeUsersArray);
  let groupedUsersArray = Object.values(groupedUsers);
  return groupedUsersArray;
}

function filterActiveUsersByTime() {
  let filtroData = new Date();
  filtroData.setDate(filtroData.getDate() - 90);
  activeUsersArray = activeUsersArray.filter((x) => x.LastOpened >= filtroData.getTime());
}

function setGaugeMetric(metric: Metric) {
  const labelsBody = metric.Labels;
  if (metric.MetricName === "gis_usuarios_online_total") {
    if (metric.Operation === 1) {
      activeInstances.labels(labelsBody[0]).inc();
    } else if (metric.Operation === 2) {
      activeInstances.labels(labelsBody[0]).dec();
    }
  }
}

function setHistogramMetric(metric: HistogramMetric) {
  const labelsBody = metric.Labels;
  switch (metric.MetricName) {
    case "gis_tempo_salvarproj_segundos":
      timeToSaveProject.observe(metric.ElapsedTimeMs!);
      break;
    case "cm_tempo_gerarproj_minutos":
      timeToGenerateProj.observe(metric.ElapsedTimeMs!);
      break;
    case "gis_tempo_op_sap_segundos":
      timeOperationsSAP.labels(labelsBody[0]).observe(metric.ElapsedTimeMs!);
      break;
    default:
      break;
  }
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

export default router;
