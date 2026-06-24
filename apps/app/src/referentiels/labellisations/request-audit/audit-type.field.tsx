import { appLabels } from '@/app/labels/catalog';
import { SujetDemande, SujetDemandeEnum } from '@tet/domain/referentiels';
import { RadioButton } from '@tet/ui';
import { ReactNode } from 'react';

const auditTypeLabels: Record<SujetDemande, string> = {
  [SujetDemandeEnum.COT]: appLabels.auditCotSansLabellisation,
  [SujetDemandeEnum.LABELLISATION_COT]:
    appLabels.demarrerAuditTypeCotAvecLabellisation,
  [SujetDemandeEnum.LABELLISATION]: appLabels.demarrerAuditTypeLabellisation,
};

type AuditTypeFieldProps = {
  options: SujetDemande[];
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
      {options.map((sujet) => (
        <RadioButton
          key={sujet}
          name="audit-type"
          value={sujet}
          checked={value === sujet}
          onChange={() => onChange(sujet)}
          label={auditTypeLabels[sujet]}
          message={
            sujet === SujetDemandeEnum.LABELLISATION_COT
              ? `* ${appLabels.demarrerAuditCotAvecLabellisationMessage}`
              : undefined
          }
        />
      ))}
    </fieldset>
  );
};
