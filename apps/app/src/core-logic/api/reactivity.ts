export type VoidCallback = () => void;

/**
 * Allow to subscribe to changes at a given path so Hooks can be made.
 *
 * Draft
 */
export class PathNotifier {
  private _listeners: Map<string, VoidCallback[]> = new Map<
    string,
    VoidCallback[]
  >();

  public notifyListeners = (path: string): void => {
    for (const [key, listeners] of this._listeners) {
      if (key.startsWith(path)) {
        for (const listener of listeners) {
          listener();
        }
      }
    }
  };
  public subscribeToPath = (path: string, listener: VoidCallback): void => {
    if (this._listeners.has(path)) {
      this._listeners.get(path)!.push(listener);
    } else {
      this._listeners.set(path, [listener]);
    }
  };

  public removeListener = (path: string, listener: VoidCallback): void => {
    if (this._listeners.has(path)) {
      const filtered = this._listeners.get(path)!.filter(l => l !== listener);
      if (filtered.length) {
        this._listeners.set(path, filtered);
      } else {
        this._listeners.delete(path);
      }
    }
  };
}

/**
 * Allow store wide callbacks
 */
export class ChangeNotifier {
  private _listeners: VoidCallback[] = [];
  public notifyListeners = (): void => {
    for (const listener of this._listeners) {
      listener();
    }
  };
  public addListener = (listener: VoidCallback): void => {
    this._listeners.push(listener);
  };

  public removeListener = (listener: VoidCallback): void => {
    this._listeners = this._listeners.filter(l => l !== listener);
  };
}
