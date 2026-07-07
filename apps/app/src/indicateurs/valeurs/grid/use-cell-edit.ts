import { useCallback, useEffect, useRef, useState } from 'react';
import { parseCellNumber } from './parse-cell-number';
import { Result } from './types';

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
  onSave: (value: number | null) => Promise<Result>;
}): CellEdit => {
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const [status, setStatus] = useState<CellEditStatus>('idle');
  const isSaving = useRef(false);
  const hasPendingSave = useRef(false);
  const draftValueRef = useRef<string | null>(null);
  draftValueRef.current = draftValue;
  const currentValueRef = useRef(currentValue);
  currentValueRef.current = currentValue;

  const currentText = currentValue === null ? '' : String(currentValue);
  const text = draftValue ?? currentText;

  useEffect(() => {
    if (status !== 'saved') {
      return;
    }
    const timer = setTimeout(() => setStatus('idle'), SAVED_ACKNOWLEDGEMENT_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const onChange = useCallback((raw: string) => {
    setDraftValue(raw.replace(DISALLOWED_CHARS, ''));
    setStatus('idle');
  }, []);

  const cancel = useCallback(() => {
    setDraftValue(null);
    setStatus('idle');
  }, []);

  const save = useCallback(async () => {
    if (isSaving.current) {
      hasPendingSave.current = true;
      return;
    }
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
      if (writeResult.ok) {
        setDraftValue((current) => (current === savedRaw ? null : current));
        setStatus((current) => (current === 'saving' ? 'saved' : current));
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      isSaving.current = false;
      if (hasPendingSave.current) {
        hasPendingSave.current = false;
        void save();
      }
    }
  }, [onSave]);

  return { text, status, onChange, save, cancel };
};
