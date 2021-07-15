import {Epci} from "../generated/models/epci";

export class EpciStorable extends Epci {
    static buildId(uid: string): string {
        return uid
    }

    get id(): string {
        return EpciStorable.buildId(this.uid)
    }
}