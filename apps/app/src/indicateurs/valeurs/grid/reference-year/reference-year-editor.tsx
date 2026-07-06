'use client';

import { Icon } from '@tet/ui';
import { JSX, useState } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { Year } from '../types';
import { ReferenceYearChangeModal } from './reference-year-change-modal';

type ReferenceYearEditorProps = {
  year: Year;
  onReferenceYearChange: (year: Year) => void;
};

export const ReferenceYearEditor = ({
  year,
  onReferenceYearChange,
}: ReferenceYearEditorProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={appLabels.indicateurModifierAnneeReference(year)}
        className="inline-flex items-center gap-1 font-bold text-primary-9"
      >
        <span className="underline decoration-dotted underline-offset-2">
          {appLabels.indicateurAnneeReference(year)}
        </span>
        <Icon icon="edit-line" size="xs" aria-hidden />
      </button>
      <ReferenceYearChangeModal
        isOpen={isOpen}
        currentYear={year}
        onConfirm={(next) => {
          const hasYearChanged = next !== year;
          if (hasYearChanged) {
            onReferenceYearChange(next);
          }
          setIsOpen(false);
        }}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
