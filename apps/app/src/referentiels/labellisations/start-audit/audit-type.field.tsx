import { appLabels } from '@/app/labels/catalog';
import { SujetDemande, SujetDemandeEnum } from '@tet/domain/referentiels';
import { RadioButton } from '@tet/ui';
import { ReactNode } from 'react';
import { AuditTypeOption } from './available-audit.types';

const auditTypeLabels: Record<SujetDemande, string> = {
  [SujetDemandeEnum.COT]: appLabels.auditCotSansLabellisation,
  [SujetDemandeEnum.LABELLISATION_COT]:
    appLabels.demarrerAuditTypeCotAvecLabellisation,
  [SujetDemandeEnum.LABELLISATION]: appLabels.demarrerAuditTypeLabellisation,
};

type AuditTypeFieldProps = {
  options: AuditTypeOption[];
  value: SujetDemande | null;
  onChange: (sujet: SujetDemande) => void;
};

export const AuditTypeField = ({
  options,
  value,
  onChange,
}: AuditTypeFieldProps): ReactNode => {
  return (
    <fieldset className="flex flex-col gap-4 m-0 p-0 border-0">
      <legend className="mb-2 p-0 font-medium text-primary-9">
        {appLabels.demarrerAuditChoixType}
      </legend>
      {options.map((option) => (
        <RadioButton
          key={option.sujet}
          name="audit-type"
          value={option.sujet}
          checked={value === option.sujet}
          disabled={option.disabled}
          onChange={() => onChange(option.sujet)}
          label={auditTypeLabels[option.sujet]}
          message={
            option.sujet === SujetDemandeEnum.LABELLISATION_COT
              ? `* ${appLabels.demarrerAuditCotAvecLabellisationMessage}`
              : undefined
          }
        />
      ))}
    </fieldset>
  );
};
