import { Metric } from "./Metric";

export class HistogramMetric extends Metric{
    constructor(public Metric : Metric,
                public ElapsedTimeMs : number = 0){
        super(Metric.MetricName, Metric.Type, Metric.Operation, Metric.Labels, Metric.User);
    }
}