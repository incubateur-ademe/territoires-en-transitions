import { useCallback, useEffect, useRef, useState } from 'react';
import { parseCellNumber } from './parse-cell-number';
import { Result } from './types';

export type CellEditStatus = 'idle' | 'saving' | 'saved' | 'error';

export type CellEdit = {
  text: string;
  status: CellEditStatus;
  onChange: (raw: string) => void;
  commit: () => Promise<void>;
  cancel: () => void;
};

const DISALLOWED_CHARS = /[^0-9.,\s-]/g;
const SAVED_ACKNOWLEDGEMENT_MS = 2000;

export const useCellEdit = ({
  serverValue,
  onCommit,
}: {
  serverValue: number | null;
  onCommit: (resultat: number | null) => Promise<Result>;
}): CellEdit => {
  const [buffer, setBuffer] = useState<string | null>(null);
  const [status, setStatus] = useState<CellEditStatus>('idle');
  const isSaving = useRef(false);

  const serverText = serverValue === null ? '' : String(serverValue);
  const text = buffer ?? serverText;

  useEffect(() => {
    if (status !== 'saved') {
      return;
    }
    const timer = setTimeout(() => setStatus('idle'), SAVED_ACKNOWLEDGEMENT_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const onChange = useCallback((raw: string) => {
    setBuffer(raw.replace(DISALLOWED_CHARS, ''));
    setStatus('idle');
  }, []);

  const cancel = useCallback(() => {
    setBuffer(null);
    setStatus('idle');
  }, []);

  const commit = useCallback(async () => {
    const nothingToCommit = buffer === null;
    if (isSaving.current || nothingToCommit) {
      return;
    }
    const committedRaw = buffer;
    const parsedValue = parseCellNumber(committedRaw);
    const isUnparseable = committedRaw.trim() !== '' && parsedValue === null;
    if (isUnparseable) {
      setStatus('error');
      return;
    }
    const isUnchanged = parsedValue === serverValue;
    if (isUnchanged) {
      setBuffer(null);
      setStatus('idle');
      return;
    }
    isSaving.current = true;
    setStatus('saving');
    try {
      const writeResult = await onCommit(parsedValue);
      if (writeResult.ok) {
        setBuffer((current) => (current === committedRaw ? null : current));
        setStatus((current) => (current === 'saving' ? 'saved' : current));
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      isSaving.current = false;
    }
  }, [buffer, serverValue, onCommit]);

  return { text, status, onChange, commit, cancel };
};
