import express, { Request, Response } from 'express';
import { isValidJson } from '../validate';
import { MetricsController } from '../controllers/MetricsController';
import { GaugeMetric, HistogramMetric, Label, WegUser } from '../models';
import { apiKeyMiddleware } from '../middleware/TokenMiddleware';

const router = express.Router();
const metricsController = new MetricsController();

router.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', await metricsController.getContentType());
  res.end(await metricsController.getMetrics());
});

router.post('/metrics/insert/gauge', apiKeyMiddleware, async (req: Request, res: Response) => {

  if (!isValidJson(req.body)) {
    return res.status(400).send("JSON is not valid.");
  }
  
  try{
    const gaugeMetric : GaugeMetric = req.body;
    gaugeMetric.User = new WegUser(req.body.User.Name, req.body.User.Unity); 
    gaugeMetric.Label = new Label(req.body.Label.LabelNames, req.body.Label.LabelValues);
    await metricsController.insertGauge(gaugeMetric);
    res.status(201).send();
  } catch(e){
    res.status(500).send("An error occurred while inserting the gauge metric.");
  }
});

router.post('/metrics/insert/histogram', apiKeyMiddleware, async (req: Request, res: Response) => {

  if (!isValidJson(req.body)) {
    return res.status(400).send("JSON is not valid.");
  }
  
  try{
    const histogramMetric : HistogramMetric = req.body;
    histogramMetric.User = new WegUser(req.body.User.Name, req.body.User.Unity);     
    histogramMetric.Label = new Label(req.body.Label.LabelNames, req.body.Label.LabelValues);  
    await metricsController.insertHistogram(histogramMetric);
    res.status(201).send();
  } catch(e){
    res.status(500).send("An error occurred while inserting the histogram metric.");
  }
});

export default router;
