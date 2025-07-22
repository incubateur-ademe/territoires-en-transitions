import { BadgeAuditStatut, statusToState } from './BadgeAuditStatut';

import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { SelectBadge } from '@/ui';
import { TAuditStatut } from './types';
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
  onChange: (newStatut: TAuditStatut) => void;
};

const options: { value: TAuditStatut; label: string }[] = [
  { value: 'non_audite', label: 'Non audité' },
  { value: 'en_cours', label: 'Audit en cours' },
  { value: 'audite', label: 'Audité' },
];
/**
 * Affiche le sélecteur de statut d'audit d'une action
 */
const ActionAuditStatutBase = (props: TActionAuditStatutBaseProps) => {
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
        onChange={(v) => onChange(v as TAuditStatut)}
        valueToBadgeState={statusToState}
        dropdownZindex={100}
      />
    </div>
  );
};

/**
 * Charge les données et fait le rendu
 */
const ActionAuditStatut = (props: TActionAuditStatutProps) => {
  const { action, className } = props;

  // donnée de l'audit en cours (si il y en a un)
  const { data: audit } = useAudit();

  // indique si l'utilisateur courant est l'auditeur
  const isAuditeur = useIsAuditeur();

  // statut d'audit de l'action
  const { data: auditStatut } = useGetMesureAuditStatut(action.id);

  // fonction d'enregistrement des modifications
  const { mutate: updateMesureAuditStatut } = useUpdateMesureAuditStatut();

  return audit && auditStatut ? (
    <>
      <div className="w-[0.5px] h-5 bg-grey-5 max-sm:hidden lg:hidden" />
      <ActionAuditStatutBase
        auditStatut={auditStatut}
        readonly={!isAuditeur || audit?.valide}
        onChange={(statut: TAuditStatut) =>
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
