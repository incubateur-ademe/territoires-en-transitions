export class MesureCustom {
    /**
     * Creates a MesureCustom instance.
     */
    constructor({ uid, epci_id, climat_pratic_thematic, name, }) {
        this.uid = uid;
        this.epci_id = epci_id;
        this.climat_pratic_thematic = climat_pratic_thematic;
        this.name = name;
    }
    get pathname() {
        return MesureCustom.pathname;
    }
}
MesureCustom.pathname = 'mesure_custom';
//# sourceMappingURL=mesure_custom.js.map