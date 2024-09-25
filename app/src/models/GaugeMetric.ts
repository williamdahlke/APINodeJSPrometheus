import { Metric } from "./Metric";

export class GaugeMetric extends Metric{
    constructor(public Metric : Metric,
                public Operation : number){
        super();        
    }
}