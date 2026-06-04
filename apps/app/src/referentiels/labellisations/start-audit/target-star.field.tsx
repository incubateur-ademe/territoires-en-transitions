import { appLabels } from '@/app/labels/catalog';
import { Etoile } from '@tet/domain/referentiels';
import { Field, Select } from '@tet/ui';
import { ReactNode } from 'react';
import { numLabels } from '../numLabels';
import { REQUESTABLE_AUDIT_STARS, RequestableAuditStar } from './audit-selection';

type TargetStarFieldProps = {
  maximumRequestableStar: Etoile;
  value: RequestableAuditStar | null;
  onChange: (star: RequestableAuditStar) => void;
};

export const TargetStarField = ({
  maximumRequestableStar,
  value,
  onChange,
}: TargetStarFieldProps): ReactNode => {
  const options = REQUESTABLE_AUDIT_STARS.filter(
    (star) => star <= maximumRequestableStar
  ).map((star) => ({
    value: star,
    label: appLabels.demarrerAuditEtoileOption({
      etoileLabel: numLabels[star],
    }),
  }));

  return (
    <Field title={appLabels.demarrerAuditChoixEtoile}>
      <Select
        dataTest="target-star"
        options={options}
        values={value ?? undefined}
        onChange={(selected: number | string | undefined) => {
          const star = REQUESTABLE_AUDIT_STARS.find((s) => s === selected);
          if (star) {
            onChange(star);
          }
        }}
      />
    </Field>
  );
};
