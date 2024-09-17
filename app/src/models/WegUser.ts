export class WegUser {

    public LastOpened: number;

    constructor(public Name: string,
        public Unity: string) {
        this.LastOpened = Date.now();
    }

    toString() : string {
        return `Name: ${this.Name}, Unity: ${this.Unity}`;
    }
}