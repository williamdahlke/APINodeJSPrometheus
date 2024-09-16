import express, { Request, Response } from 'express';
import prom from 'prom-client';
import { HistogramMetric, Metric } from '../models';
import { instanciasAtivas, tempoGerarProjeto, tempoOperacoesSap, tempoSalvarProjeto, usuariosAtivosGauge } from '../metrics';

const router = express.Router();
const register = prom.register;

let usuariosAtivos: Map<string, number> = new Map();

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
  registrarOperacao(metric);
  res.status(200).send();
});

function registrarOperacao(metric: Metric) {
  usuariosAtivos.set(metric.User, Date.now());
  gerarMetricaUsuariosAtivos(metric);
}

function gerarMetricaUsuariosAtivos(metric: Metric) {
  const filtroData = new Date();
  filtroData.setDate(filtroData.getDate() - 90);

  const arrayUsuariosAtivos = Array.from(usuariosAtivos).filter(([_, valor]) => valor >= filtroData.getTime());
  usuariosAtivos = new Map(arrayUsuariosAtivos);

  usuariosAtivosGauge.reset();
  usuariosAtivosGauge.labels(metric.Labels[0]).inc(usuariosAtivos.size);
}

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

export default router;
