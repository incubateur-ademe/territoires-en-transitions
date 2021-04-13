export class IndicateurValue {
    /**
     * Creates a IndicateurValue instance.
     */
    constructor({ epci_id, indicateur_id, year, value, }) {
        this.epci_id = epci_id;
        this.indicateur_id = indicateur_id;
        this.year = year;
        this.value = value;
    }
    get pathname() {
        return IndicateurValue.pathname;
    }
}
IndicateurValue.pathname = 'indicateur_value';
//# sourceMappingURL=indicateur_value.js.map