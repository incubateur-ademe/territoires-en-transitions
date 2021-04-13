export class ActionStatus {
    /**
     * Creates a ActionStatus instance.
     */
    constructor({ action_id, epci_id, avancement, }) {
        this.action_id = action_id;
        this.epci_id = epci_id;
        this.avancement = avancement;
    }
    get pathname() {
        return ActionStatus.pathname;
    }
}
ActionStatus.pathname = 'action_status';
//# sourceMappingURL=action_status.js.map