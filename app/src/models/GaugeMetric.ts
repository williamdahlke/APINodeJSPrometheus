import { Metric } from "./Metric";

export class GaugeMetric extends Metric{
    constructor(public Operation : number){
        super();        
    }
}