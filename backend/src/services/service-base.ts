import { Unit } from "../db/unit";

export abstract class ServiceBase {
    protected constructor(protected readonly unit: Unit) {}
}
