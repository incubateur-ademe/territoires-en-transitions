import { appLabels } from '@/app/labels/catalog';
import { BadgeAuditStatut, statusToState } from './BadgeAuditStatut';

import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { MesureAuditStatutEnum } from '@tet/domain/referentiels';
import { SelectBadge } from '@tet/ui';
import {
  MesureAuditStatut,
  useGetMesureAuditStatut,
} from './use-get-mesure-audit-statut';
import { useUpdateMesureAuditStatut } from './use-update-mesure-audit-statut';
import { useAudit, useIsAuditeur } from './useAudit';

export type TActionAuditStatutProps = {
  action: ActionDefinitionSummary;
  className?: string;
};

type TActionAuditStatutBaseProps = {
  auditStatut: MesureAuditStatut;
  readonly: boolean;
  className?: string;
  onChange: (newStatut: MesureAuditStatutEnum) => void;
};

const options: { value: MesureAuditStatutEnum; label: string }[] = [
  { value: 'non_audite', label: appLabels.auditNonAudite },
  { value: 'en_cours', label: appLabels.auditEnCours },
  { value: 'audite', label: appLabels.auditAudite },
];

export const ActionAuditStatutBase = (props: TActionAuditStatutBaseProps) => {
  const { auditStatut, readonly, className, onChange } = props;
  const { statut } = auditStatut;
  return readonly ? (
    <div data-test="action-audit-statut-ro" className={className}>
      <BadgeAuditStatut statut={statut} />
    </div>
  ) : (
    <div className={className}>
      <SelectBadge
        dataTest="action-audit-statut"
        defaultValue={statut}
        values={statut}
        options={options}
        onChange={(v) => onChange(v as MesureAuditStatutEnum)}
        valueToBadgeState={statusToState}
        dropdownZindex={100}
      />
    </div>
  );
};

const ActionAuditStatut = (props: TActionAuditStatutProps) => {
  const { action, className } = props;

  const { data: audit } = useAudit();
  const isAuditeur = useIsAuditeur();

  const { data: auditStatut } = useGetMesureAuditStatut({
    mesureId: action.id,
    enabled: !!audit,
  });

  const { mutate: updateMesureAuditStatut } = useUpdateMesureAuditStatut();

  return audit && auditStatut ? (
    <>
      <ActionAuditStatutBase
        auditStatut={auditStatut}
        readonly={!isAuditeur || audit?.valide}
        onChange={(statut: MesureAuditStatutEnum) =>
          updateMesureAuditStatut({
            collectiviteId: auditStatut.collectiviteId,
            mesureId: auditStatut.mesureId,
            statut,
          })
        }
        className={className}
      />
    </>
  ) : null;
};

export default ActionAuditStatut;
