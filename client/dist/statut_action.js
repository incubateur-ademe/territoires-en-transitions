export class StatutAction {
    /**
     * Creates a StatutAction instance.
     */
    constructor({ action_id, epci_id, avancement, date_de_creation, }) {
        this.action_id = action_id;
        this.epci_id = epci_id;
        this.avancement = avancement;
        this.date_de_creation = date_de_creation;
    }
    get pathname() {
        return StatutAction.pathname;
    }
}
StatutAction.pathname = 'statut_action';
//# sourceMappingURL=statut_action.js.map