import { Body, Controller, Get, Post, Route, Tags, Response } from 'tsoa';
import { GaugeMetric, HistogramMetric } from '../models';
import { addUpdateGauge, addUpdateHistogram, register, setActiveUserGaugeMetric } from '../services';

@Route("api/metrics")
@Tags("Metrics")
export class MetricsController extends Controller{

    /**
     * Retrieve a list of metrics
     * @returns a string with a list of metrics.
     */
    @Get()
    public async getMetrics() : Promise<string>{
        return register.metrics();
    }

    public async getContentType() : Promise<string>{
        return register.contentType;
    }

    /**
     * Post metrics of the type gauge to integrate with prometheus
     */    
    @Post("/insert/gauge")
    @Response(201, "Created")
    @Response(400, "JSON is not valid.")
    public async insertGauge(@Body() gaugeMetric : GaugeMetric) {
        addUpdateGauge(gaugeMetric);
        setActiveUserGaugeMetric(gaugeMetric);
    }

    /**
     * Post metrics of the type histogram to integrate with prometheus
     */    
    @Post("/insert/histogram")
    @Response(201, "Created")
    @Response(400, "JSON is not valid")
    public async insertHistogram(@Body() histogramMetric : HistogramMetric){
        addUpdateHistogram(histogramMetric);
        setActiveUserGaugeMetric(histogramMetric);
    }
}