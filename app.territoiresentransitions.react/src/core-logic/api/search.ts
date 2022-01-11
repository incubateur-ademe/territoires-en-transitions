import {ActionReferentiel} from 'types/action_referentiel';
import {IndicateurReferentiel} from 'types/indicateur_referentiel';

const possiblyId = new RegExp('^\\d+');
type voidCallback = () => void;

/**
 * Allow search to register callbacks
 */
class ChangeNotifier {
  private _listeners: voidCallback[] = [];
  public notifyListeners = (): void => {
    for (const listener of this._listeners) {
      listener();
    }
  };
  public addListener = (listener: voidCallback): void => {
    this._listeners.push(listener);
  };

  public removeListener = (listener: voidCallback): void => {
    this._listeners = this._listeners.filter(l => l !== listener);
  };
}

/**
 * Search base class
 */
class Search<T> extends ChangeNotifier {
  /**
   * Perform a search then notify listeners.
   * @param inputValue
   */
  public search = (inputValue: string) => {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this._needle = inputValue;
      this._search();
      this.notifyListeners();
    }, 750);
  };

  /**
   * The list of things of type T to be searched.
   */
  public haystack: T[] = [];

  /**
   * The indicateurs matching the needle, updated by search.
   */
  public matches: T[] = [];

  private _timer: any;
  private _needle = '';
  get needle(): string {
    return this._needle;
  }

  private _search = () => {
    if (this._needle) {
      this.matches = this.lookup(
        this.haystack,
        this._needle.toLowerCase(),
        possiblyId.test(this._needle)
      );
    } else {
      this.matches = this.haystack;
    }
  };

  /**
   * The core of Search, search for needle in haystack.
   *
   * @param haystack the haystack of Ts we search in.
   * @param needle the needle the user search for.
   * @param asId true if needle looks like an id.
   */
  protected lookup = (haystack: T[], needle: string, asId: boolean): T[] => {
    return [];
  };
}

/**
 * Search amongst actions.
 *
 * Example usage: ReferentielSearchBar.svelte
 */
export class ActionReferentielSearch extends Search<ActionReferentiel> {
  protected lookup = (
    actions: ActionReferentiel[],
    needle: string,
    asId: boolean
  ): ActionReferentiel[] => {
    const results = [];
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (asId && action.id_nomenclature.startsWith(needle)) {
        results.push(action);
      } else if (action.nom.toLowerCase().includes(needle)) {
        results.push(action);
      } else {
        const found = this.lookup(action.actions, needle, asId);
        for (let j = 0; j < found.length; j++) {
          results.push(found[j]);
        }
      }
    }
    return results;
  };
}

/**
 * Search amongst indicateurs.
 *
 * Example usage: ReferentielSearchBar.svelte
 */
export class IndicateurReferentielSearch extends Search<IndicateurReferentiel> {
  protected lookup = (
    indicateurs: IndicateurReferentiel[],
    needle: string,
    asId: boolean
  ): IndicateurReferentiel[] => {
    const results: IndicateurReferentiel[] = [];
    for (let i = 0; i < indicateurs.length; i++) {
      const indicateur = indicateurs[i];
      if (asId && indicateur.id.startsWith(needle)) {
        results.push(indicateur);
      } else if (
        indicateur.nom.toLowerCase().includes(needle) ||
        indicateur.description.toLowerCase().includes(needle)
      ) {
        results.push(indicateur);
      }
    }
    return results;
  };
}
