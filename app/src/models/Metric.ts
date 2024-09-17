import { WegUser } from "./WegUser";

export class Metric{
    constructor(public MetricName : string = "",
                public Type : number = 0,
                public Operation : number = 0,
                public Labels : string[] = [],
                public User : WegUser){}
}
