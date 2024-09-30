import express, { Request, Response } from 'express';
import { isValidJson } from '../validate';
import { MetricsController } from '../controllers/MetricsController';
import { GaugeMetric, HistogramMetric, Label, WegUser } from '../models';

const router = express.Router();
const metricsController = new MetricsController();

router.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', await metricsController.getContentType());
  res.end(await metricsController.getMetrics());
});

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
