import express, { Request, Response } from 'express';
import prom from 'prom-client';
import { HistogramMetric, Metric, WegUser } from '../models';
import { instanciasAtivas, tempoGerarProjeto, tempoOperacoesSap, tempoSalvarProjeto, usuariosAtivosGauge } from '../metrics';

const router = express.Router();
const register = prom.register;

let usuariosAtivos: WegUser[] = [];

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Retrieve a list of metrics
 *     responses:
 *       200:
 *         description: A list of metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

router.post('/metrics/insert', (req: Request, res: Response) => {

  if (!isValidJson(req.body)) {
    return res.status(400).send("JSON is not valid.");
  }
  
  let metric: Metric = req.body;
  metric.User = new WegUser(req.body.User.Name, req.body.User.Unity); 

  switch (metric.Type) {
    case 2:
      setGaugeValue(metric);
      break;
    case 3:
      const histogramMetric : HistogramMetric = new HistogramMetric(metric);
      setHistogramValue(histogramMetric);
      break;
    default:
      return res.status(400).send("Metric type isn't registered.");
  }

  let usuarioSelecionado = usuariosAtivos.find(x=> x.Name == metric.User.Name && x.Unity == metric.User.Unity);
  if (usuarioSelecionado == undefined){
    usuariosAtivos.push(metric.User);
  }

  let filtroData = new Date();  
  filtroData.setDate(filtroData.getDate() - 90);

  usuariosAtivos = usuariosAtivos.filter((x) => x.LastOpened >= filtroData.getTime());

  let groupedUsers = groupByUnity(usuariosAtivos);
  let groupedUsersArray = Object.values(groupedUsers);
  console.log(groupedUsersArray);

  usuariosAtivosGauge.reset();

  groupedUsersArray.forEach((item) => {
    usuariosAtivosGauge.labels(item.unity).inc(item.totalUsers)
  })
  
  res.status(200).send();
});

function setGaugeValue(metric: Metric) {
  const labelsBody = metric.Labels;
  if (metric.MetricName === "gis_usuarios_online_total") {
    if (metric.Operation === 1) {
      instanciasAtivas.labels(labelsBody[0]).inc();
    } else if (metric.Operation === 2) {
      instanciasAtivas.labels(labelsBody[0]).dec();
    }
  }
}

function setHistogramValue(metric: HistogramMetric) {
  const labelsBody = metric.Labels;
  switch (metric.MetricName) {
    case "gis_tempo_salvarproj_segundos":
      tempoSalvarProjeto.observe(metric.ElapsedTimeMs!);
      break;
    case "cm_tempo_gerarproj_minutos":
      tempoGerarProjeto.observe(metric.ElapsedTimeMs!);
      break;
    case "gis_tempo_op_sap_segundos":
      tempoOperacoesSap.labels(labelsBody[0]).observe(metric.ElapsedTimeMs!);
      break;
    default:
      break;
  }
}

function isValidJson(json: any): boolean {
  if (typeof json !== 'object' || json === null) {
    return false;
  }
  try {
    JSON.stringify(json);
    return true;
  } catch (e) {
    return false;
  }
}

interface GroupedUsers {
  [key: string]: { unity: string, totalUsers: number };
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
