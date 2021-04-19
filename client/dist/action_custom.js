export class ActionCustom {
    /**
     * Creates a ActionCustom instance.
     */
    constructor({ uid, epci_id, mesure_id, name, description, }) {
        this.uid = uid;
        this.epci_id = epci_id;
        this.mesure_id = mesure_id;
        this.name = name;
        this.description = description;
    }
    get pathname() {
        return ActionCustom.pathname;
    }
}
ActionCustom.pathname = 'action_custom';
//# sourceMappingURL=action_custom.js.map