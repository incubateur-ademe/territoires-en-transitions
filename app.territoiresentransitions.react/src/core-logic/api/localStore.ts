import {Storable} from './storable';
import {
  ActionCustom,
  ActionCustomInterface,
  ActionStatus,
  ActionStatusInterface,
  AnyIndicateurValueInterface,
  FicheActionCategorieInterface,
  FicheActionInterface,
  IndicateurPersonnaliseInterface,
} from 'generated/models';
import {
  ActionStatusStorable,
  AnyIndicateurValueStorable,
  ActionCustomStorable,
  FicheActionStorable,
  FicheActionCategorieStorable,
  UtilisateurConnecteLocalStorable,
  IndicateurPersonnaliseStorable,
  UtilisateurConnecteInterface,
  UtilisateurConnecte,
} from 'storables';
import {ChangeNotifier} from 'core-logic/api/reactivity';

/**
 * Get store by pathname from localStorage
 *
 * Returns an empty store if none found.
 */
const getStore = (pathname: string): Record<string, object> => {
  const storeJson = localStorage.getItem(pathname) || '{}';
  return JSON.parse(storeJson);
};

/**
 * Set store data at pathname.
 */
const saveStore = (
  pathname: string,
  newStore: Record<string, object>
): void => {
  localStorage.setItem(pathname, JSON.stringify(newStore));
};

/**
 * A Store for Storable object using local storage.
 */
export class LocalStore<T extends Storable> extends ChangeNotifier {
  constructor({
    pathname,
    serializer,
    deserializer,
  }: {
    pathname: string;
    serializer: (storable: T) => object;
    deserializer: (serialized: object) => T;
  }) {
    super();
    this.pathname = pathname;
    this.serializer = serializer;
    this.deserializer = deserializer;
  }

  pathname: string;
  serializer: (storable: T) => object;
  deserializer: (serialized: object) => T;

  /**
   * Store a Storable at pathname/id.
   *
   * @param storable the object to save
   */
  store(storable: T): T {
    const store = getStore(this.pathname);
    store[storable.id] = storable;
    saveStore(this.pathname, store);
    this.notifyListeners();
    return storable;
  }

  /**
   * Return all storable of type T existing at pathname.
   * If nothing is found returns an empty record.
   */
  retrieveAll(): Array<T> {
    const store = getStore(this.pathname);
    if (!Object.keys(store)) return [];
    return this.deserializeStore(store);
  }

  /**
   * Return a storable with matching path and path.
   * Throw if no storable is found or path does not exist.
   *
   * @param id Storable id
   */
  retrieveById(id: string): T {
    const store = getStore(this.pathname);
    const serialized = store[id];
    if (!serialized) {
      throw new Error(`Storable '${this.pathname}.${id}' does not exist.`);
    }

    return this.deserializer(serialized);
  }

  /**
   * Delete a Storable stored at pathname/id.
   * Return true if something was deleted, false if nothing exists at pathname/id.
   *
   * @param id Storable id
   */
  deleteById(id: string): boolean {
    const store = getStore(this.pathname);
    if (!store[id]) return false;
    delete store[id];
    saveStore(this.pathname, store);
    this.notifyListeners();
    return true;
  }

  /**
   * Return an Array of storable that matches a predicate.
   * Iterate on *all* storables.
   *
   * @param predicate A function that returns true on match
   */
  where(predicate: (storable: T) => boolean): Array<T> {
    const matches: T[] = [];
    const all = this.retrieveAll();
    for (const storable of all) {
      if (predicate(storable)) matches.push(storable);
    }
    return matches;
  }

  /**
   * Deserialize a record retrieved from local storage.
   */
  private deserializeStore(store: Record<string, object>): Array<T> {
    const reducer = (accumulator: Array<T>, serialized: object) => {
      accumulator.push(this.deserializer(serialized));
      return accumulator;
    };
    return Object.values(store).reduce(reducer, []) as Array<T>;
  }
}

export const actionCustomStore = new LocalStore<ActionCustomStorable>({
  pathname: ActionCustom.pathname,
  serializer: storable => storable,
  deserializer: serialized =>
    new ActionCustomStorable(serialized as ActionCustomInterface),
});

export const actionStatusStore = new LocalStore<ActionStatusStorable>({
  pathname: ActionStatus.pathname,
  serializer: storable => storable,
  deserializer: serialized =>
    new ActionStatusStorable(serialized as ActionStatusInterface),
});

export const ficheActionStore = new LocalStore<FicheActionStorable>({
  pathname: FicheActionStorable.pathname,
  serializer: storable => storable,
  deserializer: serialized =>
    new FicheActionStorable(serialized as FicheActionInterface),
});

export const ficheActionCategorieStore =
  new LocalStore<FicheActionCategorieStorable>({
    pathname: FicheActionCategorieStorable.pathname,
    serializer: storable => storable,
    deserializer: serialized =>
      new FicheActionCategorieStorable(
        serialized as FicheActionCategorieInterface
      ),
  });

export const indicateurPersonnaliseStore =
  new LocalStore<IndicateurPersonnaliseStorable>({
    pathname: IndicateurPersonnaliseStorable.pathname,
    serializer: storable => storable,
    deserializer: serialized =>
      new IndicateurPersonnaliseStorable(
        serialized as IndicateurPersonnaliseInterface
      ),
  });

export const indicateurPersonnaliseResultatStore =
  new LocalStore<AnyIndicateurValueStorable>({
    pathname: AnyIndicateurValueStorable.pathname,
    serializer: storable => storable,
    deserializer: serialized =>
      new AnyIndicateurValueStorable(serialized as AnyIndicateurValueInterface),
  });

export const utilisateurConnecteLocalStore =
  new LocalStore<UtilisateurConnecteLocalStorable>({
    pathname: UtilisateurConnecte.pathname,
    serializer: storable => storable,
    deserializer: serialized =>
      new UtilisateurConnecteLocalStorable(
        serialized as UtilisateurConnecteInterface
      ),
  });
