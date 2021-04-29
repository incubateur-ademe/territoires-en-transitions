import type {ActionReferentiel} from "../../generated/models/action_referentiel";

const possiblyId = new RegExp('^\\d+');
type voidCallback = () => void[]

class ChangeNotifier {
    private _listeners: voidCallback[] = []
    public notifyListeners = () => {
        for (let listener of this._listeners) {
            listener()
        }
    }
    public addListener = (listener: voidCallback) => {
        this._listeners.push(listener)
    }

    public removeListener = (listener: voidCallback) => {
        this._listeners = this._listeners.filter((l) => l != listener)
    }
}

export class ActionReferentielSearch extends ChangeNotifier {

    public search = (input_value) => {
        clearTimeout(this._timer);
        this._timer = setTimeout(() => {
            this._needle = input_value;
            this._search()
        }, 750);
    }

    public matches: ActionReferentiel[] = [];
    public actions: ActionReferentiel[] = [];

    private _timer;
    private _needle: string = '';

    private _search = () => {
        if (this._needle) {
            this.matches = this._lookup(this.actions, this._needle.toLowerCase(), possiblyId.test(this._needle))
        } else {
            this.matches = this.actions
        }
        this.notifyListeners()
    }

    private _lookup = (actions: ActionReferentiel[], needle: string, asId: boolean): ActionReferentiel[] => {
        let results = []
        for (let i = 0; i < actions.length; i++) {
            let action = actions[i]
            if (asId && action.id_nomenclature.startsWith(needle)) {
                results.push(action)
            } else if (action.nom.toLowerCase().includes(needle)) {
                results.push(action)
            } else {
                const found = this._lookup(action.actions, needle, asId);
                for (let j = 0; j < found.length; j++) {
                    results.push(found[j])
                }
            }
        }
        return results
    }
}