'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, Icon, Input } from '@tet/ui';
import Link from 'next/link';
import { useRef, useState, type JSX } from 'react';

type Props = {
  label: string;
  href: string;
  isInitiallyEditing: boolean;
  onRename: ((titre: string) => void) | undefined;
  onEditingEnd: () => void;
};

export const SousIndicateurNameEditor = ({
  label,
  href,
  isInitiallyEditing,
  onRename,
  onEditingEnd,
}: Props): JSX.Element => {
  const [isEditing, setIsEditing] = useState(
    isInitiallyEditing && onRename !== undefined
  );
  const [draft, setDraft] = useState(label);
  const isFinishedRef = useRef(false);

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
        autoFocus
        aria-label={appLabels.indicateurSousIndicateurNom}
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
          }
        }}
      />
    );
  }

  if (onRename === undefined) {
    return (
      <Link className="text-primary-9 underline" href={href}>
        {label}
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Button
        variant="unstyled"
        size="xs"
        className="text-primary-9 hover:underline"
        aria-label={appLabels.indicateurSousIndicateurRenommer({ label })}
        onClick={() => {
          isFinishedRef.current = false;
          setDraft(label);
          setIsEditing(true);
        }}
      >
        {label}
      </Button>
      <Link
        className="flex text-primary-9"
        href={href}
        aria-label={appLabels.indicateurSousIndicateurOuvrir({ label })}
      >
        <Icon icon="arrow-right-s-line" size="sm" />
      </Link>
    </span>
  );
};
