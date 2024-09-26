import { Label } from "./Label";
import { WegUser } from "./WegUser";

export class Metric{

    public MetricName : string = "";
    public Help : string = "";
    public Type : number = 0;
    public Operation : number = 0;
    public Label? : Label;
    public User? : WegUser;
    
    constructor(){}
}
