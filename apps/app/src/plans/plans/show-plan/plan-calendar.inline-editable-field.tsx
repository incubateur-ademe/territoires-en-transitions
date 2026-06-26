'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  DateRangeInlineEditor,
  formatDateRange,
} from '@/app/ui/date-range/date-range.inline-editor';
import { MetadataItem } from '@/app/ui/metadata-line';
import { InlineEditWrapper } from '@tet/ui';
import { useCallback } from 'react';
import { usePlanAxesContext } from './plan-arborescence.view/plan-axes.context';

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
        <DateRangeInlineEditor
          dateDebut={dateDebut}
          dateFin={dateFin}
          onSave={handleSave}
          dataTestPrefix="plan-date"
        />
      )}
    >
      <MetadataItem
        interactive={!isReadOnly}
        icon="calendar-line"
        label={appLabels.planCalendrier}
        value={formatDateRange(dateDebut, dateFin) ?? undefined}
      />
    </InlineEditWrapper>
  );
};
