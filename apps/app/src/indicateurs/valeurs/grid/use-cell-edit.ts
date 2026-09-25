import { useCallback, useEffect, useRef, useState } from 'react';
import { parseCellNumber } from './parse-cell-number';

export type CellEditStatus = 'idle' | 'saving' | 'saved' | 'error';

export type CellEdit = {
  text: string;
  status: CellEditStatus;
  onChange: (raw: string) => void;
  save: () => Promise<void>;
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
  const isSaving = useRef(false);
  const hasPendingSave = useRef(false);
  const pendingSavedRaw = useRef<string | undefined>(undefined);
  const draftValueRef = useRef<string | null>(null);
  const currentValueRef = useRef(currentValue);

  const currentText = currentValue === null ? '' : String(currentValue);
  const text = draftValue ?? currentText;

  /**
   * `save` est appelée à la fermeture de la cellule, hors du rendu qui l'a
   * créée : elle lit la saisie et la valeur courante dans des refs plutôt que
   * dans sa fermeture. Les rafraîchir ici — et non pendant le rendu — garde
   * l'écriture de la ref dans la phase de commit, seule phase où React
   * l'autorise. Placé avant l'effet suivant, qui les relit.
   */
  useEffect(() => {
    draftValueRef.current = draftValue;
    currentValueRef.current = currentValue;
  });

  useEffect(() => {
    if (status !== 'saved') {
      return;
    }
    const timer = setTimeout(() => setStatus('idle'), SAVED_ACKNOWLEDGEMENT_MS);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    const savedRaw = pendingSavedRaw.current;
    const currentValueReflectsSave =
      savedRaw !== undefined &&
      draftValueRef.current === savedRaw &&
      currentValue === parseCellNumber(savedRaw);
    if (currentValueReflectsSave) {
      pendingSavedRaw.current = undefined;
      setDraftValue(null);
    }
  }, [currentValue]);

  const onChange = useCallback((raw: string) => {
    setDraftValue(raw.replace(DISALLOWED_CHARS, ''));
    setStatus('idle');
  }, []);

  const cancel = useCallback(() => {
    draftValueRef.current = null;
    setDraftValue(null);
    setStatus('idle');
  }, []);

  const save = useCallback(async () => {
    if (isSaving.current) {
      hasPendingSave.current = true;
      return;
    }
    // Une boucle plutôt qu'un rappel récursif de `save` : la reprise ne
    // dépend plus de la fermeture du rendu courant, et l'appelant peut
    // attendre la dernière écriture et non seulement la première.
    do {
      hasPendingSave.current = false;
      const savedRaw = draftValueRef.current;
      if (savedRaw === null) {
        return;
      }
      const parsedValue = parseCellNumber(savedRaw);
      const isUnparseable = savedRaw.trim() !== '' && parsedValue === null;
      if (isUnparseable) {
        setStatus('error');
        return;
      }
      const isUnchanged = parsedValue === currentValueRef.current;
      if (isUnchanged) {
        setDraftValue(null);
        setStatus('idle');
        return;
      }
      isSaving.current = true;
      setStatus('saving');
      try {
        const writeResult = await onSave(parsedValue);
        if (writeResult) {
          pendingSavedRaw.current = savedRaw;
          setStatus((current) => (current === 'saving' ? 'saved' : current));
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      } finally {
        isSaving.current = false;
      }
    } while (hasPendingSave.current);
  }, [onSave]);

  return { text, status, onChange, save, cancel };
};
