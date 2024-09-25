import { Metric } from "./Metric";

export class HistogramMetric extends Metric{
    constructor(public ElapsedTimeMs : number = 0,
                public Buckets : number[]){
        super();
    }
}