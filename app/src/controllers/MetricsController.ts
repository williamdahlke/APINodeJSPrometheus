import { Controller, Get, Route, Tags } from 'tsoa';
import { GaugeMetric, HistogramMetric, Label, Metric, WegUser } from '../models';
import { addUpdateGauge, addUpdateHistogram, register, setActiveUserGaugeMetric } from '../services';

@Route("api/metrics")
export class MetricsController extends Controller{

    @Get()
    public async getMetrics() : Promise<string>{
        return register.metrics();
    }

    public async getContentType() : Promise<string>{
        return register.contentType;
    }

    public async insertGauge(gaugeMetric : GaugeMetric) {
        addUpdateGauge(gaugeMetric);
        setActiveUserGaugeMetric(gaugeMetric);
    }

    public async insertHistogram(histogramMetric : HistogramMetric){
        addUpdateHistogram(histogramMetric);
        setActiveUserGaugeMetric(histogramMetric);
    }
}