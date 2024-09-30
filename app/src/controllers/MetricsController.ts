import { Get, Route, Tags } from 'tsoa';
import { GaugeMetric, HistogramMetric, Label, Metric, WegUser } from '../models';
import { addUpdateGauge, addUpdateHistogram, register, setActiveUserGaugeMetric } from '../services';


export class MetricsController{

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