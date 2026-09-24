import { useCallback, useEffect, useRef, useState } from 'react';
import { parseCellNumber } from './parse-cell-number';

export type CellEditStatus = 'idle' | 'saving' | 'saved' | 'error';
type CellEditError = 'invalid' | 'save';

export type CellEdit = {
  text: string;
  status: CellEditStatus;
  error: CellEditError | null;
  onChange: (raw: string) => void;
  /** `true` autorise la fermeture de l'éditeur. */
  save: () => Promise<boolean>;
  cancel: () => void;
};

const DISALLOWED_CHARS = /[^0-9.,\s-]/g;
const SAVED_ACKNOWLEDGEMENT_MS = 2000;

export const useCellEdit = ({
  currentValue,
  onSave,
}: {
  currentValue: number | null;
  onSave: (value: number | null) => Promise<boolean>;
}): CellEdit => {
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const [status, setStatus] = useState<CellEditStatus>('idle');
  const [error, setError] = useState<CellEditError | null>(null);
  const savePromiseRef = useRef<{
    editVersion: number;
    promise: Promise<boolean>;
  } | null>(null);
  const editVersionRef = useRef(0);
  const draftValueRef = useRef<string | null>(null);
  const persistedValueRef = useRef(currentValue);

  const currentText = currentValue === null ? '' : String(currentValue);
  const text = draftValue ?? currentText;

  useEffect(() => {
    if (status !== 'saved') {
      return;
    }
    const timer = setTimeout(() => setStatus('idle'), SAVED_ACKNOWLEDGEMENT_MS);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    persistedValueRef.current = currentValue;
  }, [currentValue]);

  const onChange = useCallback((raw: string) => {
    const sanitized = raw.replace(DISALLOWED_CHARS, '');
    // La ref est mise à jour dans le même événement : une validation au clavier
    // déclenchée avant le prochain rendu lit bien le dernier caractère saisi.
    draftValueRef.current = sanitized;
    setDraftValue(sanitized);
    setStatus('idle');
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    editVersionRef.current += 1;
    draftValueRef.current = null;
    setDraftValue(null);
    setStatus('idle');
    setError(null);
  }, []);

  const runSave = useCallback(
    async (editVersion: number): Promise<boolean> => {
      // Une saisie peut encore changer pendant l'appel réseau. Dans ce cas, le
      // premier résultat est acquitté puis le dernier draft est enregistré avant
      // d'autoriser la fermeture.
      while (true) {
        if (editVersion !== editVersionRef.current) {
          return true;
        }
        const savedRaw = draftValueRef.current;
        if (savedRaw === null) {
          return true;
        }
        const parsedValue = parseCellNumber(savedRaw);
        const isUnparseable = savedRaw.trim() !== '' && parsedValue === null;
        if (isUnparseable) {
          setStatus('error');
          setError('invalid');
          return false;
        }
        if (parsedValue === persistedValueRef.current) {
          draftValueRef.current = null;
          setDraftValue(null);
          setStatus('idle');
          setError(null);
          return true;
        }

        setStatus('saving');
        setError(null);
        try {
          const writeResult = await onSave(parsedValue);
          if (writeResult) {
            // Conserver l'écriture acquittée même si Escape a ouvert une
            // nouvelle génération d'édition pendant la requête. La sauvegarde
            // mise en file doit se comparer au dernier état réellement écrit,
            // et non à la prop qui pouvait encore contenir l'ancienne valeur.
            persistedValueRef.current = parsedValue;
          }
          // Escape peut fermer l'éditeur pendant que la requête se termine. Son
          // reset ne doit alors pas être remplacé par un acquittement tardif.
          if (editVersion !== editVersionRef.current) {
            return true;
          }
          if (!writeResult) {
            setStatus('error');
            setError('save');
            return false;
          }
        } catch {
          if (editVersion !== editVersionRef.current) {
            return true;
          }
          setStatus('error');
          setError('save');
          return false;
        }

        if (draftValueRef.current !== savedRaw) {
          continue;
        }

        // `onSave` attend l'invalidation des requêtes. On libère donc le draft
        // après son succès : la valeur rendue vient de la réponse serveur, y
        // compris lorsqu'elle a été normalisée ou arrondie.
        draftValueRef.current = null;
        setDraftValue(null);
        setStatus('saved');
        setError(null);
        return true;
      }
    },
    [onSave]
  );

  const save = useCallback((): Promise<boolean> => {
    const editVersion = editVersionRef.current;
    const activeSave = savePromiseRef.current;
    if (activeSave?.editVersion === editVersion) {
      return activeSave.promise;
    }

    // Après Escape, une nouvelle édition doit attendre l'écriture déjà en vol
    // pour conserver l'ordre serveur, tout en ayant sa propre promesse.
    const run = () => runSave(editVersion);
    const promise = (
      activeSave ? activeSave.promise.then(run, run) : run()
    ).finally(() => {
      if (savePromiseRef.current?.promise === promise) {
        savePromiseRef.current = null;
      }
    });
    savePromiseRef.current = { editVersion, promise };
    return promise;
  }, [runSave]);

  return { text, status, error, onChange, save, cancel };
};
