export interface IndicateurValueInterface {
    epci_id: string,
        indicateur_id: string,
        year: number,
        value: string,
}

export class IndicateurValue {
    public static pathname: string = 'indicateur_value';
    get pathname(): string {
        return IndicateurValue.pathname;
    }
    epci_id: string;
    indicateur_id: string;
    year: number;
    value: string;

    /**
     * Creates a IndicateurValue instance.
     */
    constructor({
        epci_id,
        indicateur_id,
        year,
        value,
    }: {
        epci_id: string,
        indicateur_id: string,
        year: number,
        value: string,
    }) {
        this.epci_id = epci_id;
        this.indicateur_id = indicateur_id;
        this.year = year;
        this.value = value;
    }
}