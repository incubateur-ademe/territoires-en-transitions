'use client';

import { appLabels } from '@/app/labels/catalog';
import { Input } from '@tet/ui';
import { useCallback, useEffect, useRef, useState, type JSX } from 'react';

type Props = {
  label: string;
  shouldEdit: boolean;
  onRename: ((titre: string) => void) | undefined;
  onEditingEnd: () => void;
};

export const SousIndicateurNameEditor = ({
  label,
  shouldEdit,
  onRename,
  onEditingEnd,
}: Props): JSX.Element => {
  const [isEditing, setIsEditing] = useState(
    shouldEdit && onRename !== undefined
  );
  const [draft, setDraft] = useState(label);
  const isFinishedRef = useRef(false);
  const shouldRefocusRef = useRef(false);
  const renameButtonRef = useRef<HTMLButtonElement>(null);

  const startEditing = useCallback((): void => {
    isFinishedRef.current = false;
    setDraft(label);
    setIsEditing(true);
  }, [label]);

  useEffect(() => {
    if (
      shouldEdit &&
      onRename !== undefined &&
      !isEditing &&
      !isFinishedRef.current
    ) {
      startEditing();
    }
  }, [shouldEdit, onRename, isEditing, startEditing]);

  useEffect(() => {
    if (!isEditing && shouldRefocusRef.current) {
      shouldRefocusRef.current = false;
      renameButtonRef.current?.focus();
    }
  }, [isEditing]);

  const stopEditing = (): void => {
    isFinishedRef.current = true;
    setIsEditing(false);
    onEditingEnd();
  };
  const commit = (): void => {
    if (isFinishedRef.current) {
      return;
    }
    const titre = draft.trim();
    if (onRename !== undefined && titre !== '' && titre !== label) {
      onRename(titre);
    }
    setDraft(label);
    stopEditing();
  };
  const cancel = (): void => {
    if (isFinishedRef.current) {
      return;
    }
    setDraft(label);
    stopEditing();
  };

  if (isEditing) {
    return (
      <Input
        type="text"
        containerClassname="w-full"
        className="min-w-0"
        autoFocus
        aria-label={appLabels.indicateurSousIndicateurNom}
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) {
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            shouldRefocusRef.current = true;
            commit();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            shouldRefocusRef.current = true;
            cancel();
          }
        }}
      />
    );
  }

  if (onRename === undefined) {
    return (
      <span className="block truncate font-bold text-grey-8" title={label}>
        {label}
      </span>
    );
  }

  return (
    <button
      ref={renameButtonRef}
      type="button"
      className="block max-w-full cursor-text truncate rounded px-1 py-0.5 -mx-1 text-left font-bold text-grey-8 hover:bg-grey-3"
      title={label}
      aria-label={appLabels.indicateurSousIndicateurRenommer({ label })}
      onClick={startEditing}
    >
      {label}
    </button>
  );
};
