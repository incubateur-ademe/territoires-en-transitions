'use client';

import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate, isDateValid } from '@/app/utils/formatUtils';
import { Field, FieldMessage, Icon, Input } from '@tet/ui';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { RiArrowRightLine } from '@remixicon/react';

const toDateInputValue = (date: string | null): string => {
  if (!date || !isDateValid(date)) return '';
  return format(new Date(date), 'yyyy-MM-dd');
};

export const formatDateRange = (
  dateDebut: string | null,
  dateFin: string | null
): string | null => {
  const debut = dateDebut
    ? getTextFormattedDate({ date: dateDebut, shortMonth: true })
    : null;
  const fin = dateFin
    ? getTextFormattedDate({ date: dateFin, shortMonth: true })
    : null;

  if (debut && fin) return `${debut} → ${fin}`;
  if (debut) return debut;
  if (fin) return `→ ${fin}`;
  return null;
};

export type DateRangeInlineEditorProps = {
  dateDebut: string | null;
  dateFin: string | null;
  onSave: (values: {
    dateDebut: string | null;
    dateFin: string | null;
  }) => void;
  dateFinDisabled?: boolean;
  dataTestPrefix?: string;
};

/** Éditeur inline des deux dates, sans bouton de validation. Sauvegarde à la fermeture. */
export const DateRangeInlineEditor = ({
  dateDebut,
  dateFin,
  onSave,
  dateFinDisabled = false,
  dataTestPrefix = 'date-range',
}: DateRangeInlineEditorProps) => {
  const initialDebut = toDateInputValue(dateDebut);
  const initialFin = toDateInputValue(dateFin);
  const [draftDebut, setDraftDebut] = useState(initialDebut);
  const [draftFin, setDraftFin] = useState(initialFin);
  const draftDebutRef = useRef(initialDebut);
  const draftFinRef = useRef(initialFin);
  const onSaveRef = useRef(onSave);
  const dateDebutRef = useRef(dateDebut);
  const dateFinRef = useRef(dateFin);
  const dateFinDisabledRef = useRef(dateFinDisabled);

  useEffect(() => {
    onSaveRef.current = onSave;
    dateDebutRef.current = dateDebut;
    dateFinRef.current = dateFin;
    dateFinDisabledRef.current = dateFinDisabled;
  });

  useEffect(() => {
    return () => {
      const nextDebut = draftDebutRef.current || null;
      const nextFin = dateFinDisabledRef.current
        ? dateFinRef.current
        : draftFinRef.current || null;
      const hasError = !!nextDebut && !!nextFin && nextFin < nextDebut;
      const debutChanged =
        nextDebut !== toDateInputValue(dateDebutRef.current);
      const finChanged = dateFinDisabledRef.current
        ? false
        : nextFin !== (toDateInputValue(dateFinRef.current) || null);
      const hasChanged = debutChanged || finChanged;

      if (!hasError && hasChanged) {
        onSaveRef.current({ dateDebut: nextDebut, dateFin: nextFin });
      }
    };
  }, []);

  const hasError = !!draftDebut && !!draftFin && draftFin < draftDebut;

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-end gap-2">
        <Field
          title={appLabels.dateDebut}
          state={hasError ? 'error' : 'default'}
        >
          <Input
            type="date"
            data-test={`${dataTestPrefix}-debut`}
            autoFocus
            value={draftDebut}
            onChange={(e) => {
              draftDebutRef.current = e.target.value;
              setDraftDebut(e.target.value);
            }}
          />
        </Field>
        <Icon icon={<RiArrowRightLine />} className="text-grey-6 shrink-0 mb-4" />
        <Field title={appLabels.dateFin} state={hasError ? 'error' : 'default'}>
          <Input
            type="date"
            data-test={`${dataTestPrefix}-fin`}
            disabled={dateFinDisabled}
            value={dateFinDisabled ? '' : draftFin}
            onChange={(e) => {
              draftFinRef.current = e.target.value;
              setDraftFin(e.target.value);
            }}
          />
        </Field>
      </div>
      {hasError ? (
        <FieldMessage
          state="error"
          message={appLabels.planDateFinPosterieureDateDebut}
        />
      ) : null}
    </div>
  );
};
