'use client';

import { appLabels } from '@/app/labels/catalog';
import { MetadataItem } from '@/app/ui/metadata-line';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import {
  Field,
  FieldMessage,
  Icon,
  InlineEditWrapper,
  InputDate,
} from '@tet/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlanAxesContext } from './plan-arborescence.view/plan-axes.context';

const formatPlanDateRange = (
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

const PLAN_DATE_ORDER_ERROR =
  'La date de fin doit être postérieure ou égale à la date de début';

export const PlanCalendarInlineEditableField = () => {
  const { plan, isReadOnly, updatePlan } = usePlanAxesContext();
  const { id, collectiviteId, dateDebut, dateFin } = plan;

  const handleSave = useCallback(
    (values: { dateDebut: string | null; dateFin: string | null }) => {
      updatePlan({ id, collectiviteId, ...values });
    },
    [id, collectiviteId, updatePlan]
  );

  return (
    <InlineEditWrapper
      disabled={isReadOnly}
      floatingMatchReferenceHeight={false}
      renderOnEdit={() => (
        <PlanCalendarInlineEditableFieldEditor
          dateDebut={dateDebut}
          dateFin={dateFin}
          onSave={handleSave}
        />
      )}
    >
      <MetadataItem
        interactive={!isReadOnly}
        icon="calendar-line"
        label={appLabels.planCalendrier}
        value={formatPlanDateRange(dateDebut, dateFin) ?? undefined}
      />
    </InlineEditWrapper>
  );
};

/** Éditeur inline des deux dates du plan, sans bouton de validation. */
const PlanCalendarInlineEditableFieldEditor = ({
  dateDebut,
  dateFin,
  onSave,
}: {
  dateDebut: string | null;
  dateFin: string | null;
  onSave: (values: {
    dateDebut: string | null;
    dateFin: string | null;
  }) => void;
}) => {
  const [draftDebut, setDraftDebut] = useState(dateDebut ?? '');
  const [draftFin, setDraftFin] = useState(dateFin ?? '');
  const draftDebutRef = useRef(draftDebut);
  const draftFinRef = useRef(draftFin);

  useEffect(() => {
    return () => {
      const nextDebut = draftDebutRef.current || null;
      const nextFin = draftFinRef.current || null;
      const hasError = !!nextDebut && !!nextFin && nextFin < nextDebut;
      const hasChanged =
        nextDebut !== (dateDebut ?? null) || nextFin !== (dateFin ?? null);

      if (!hasError && hasChanged) {
        onSave({ dateDebut: nextDebut, dateFin: nextFin });
      }
    };
  }, [dateDebut, dateFin, onSave]);

  const hasError = !!draftDebut && !!draftFin && draftFin < draftDebut;

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-end gap-2 ">
        <Field
          title={appLabels.planDateDebut}
          state={hasError ? 'error' : 'default'}
        >
          <InputDate
            data-test="plan-date-debut"
            autoFocus
            value={draftDebut}
            onChange={(e) => {
              draftDebutRef.current = e.target.value;
              setDraftDebut(e.target.value);
            }}
          />
        </Field>
        <Icon icon="arrow-right-line" className="text-grey-6 shrink-0 mb-4" />
        <Field
          title={appLabels.planDateFin}
          state={hasError ? 'error' : 'default'}
        >
          <InputDate
            data-test="plan-date-fin"
            value={draftFin}
            onChange={(e) => {
              draftFinRef.current = e.target.value;
              setDraftFin(e.target.value);
            }}
          />
        </Field>
      </div>
      {hasError ? (
        <FieldMessage state="error" message={PLAN_DATE_ORDER_ERROR} />
      ) : null}
    </div>
  );
};
