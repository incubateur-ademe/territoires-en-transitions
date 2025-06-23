import { BadgeAuditStatut, statusToState } from './BadgeAuditStatut';

import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { SelectBadge } from '@/ui';
import { TActionAuditStatut, TAuditStatut } from './types';
import { useActionAuditStatut } from './useActionAuditStatut';
import { useAudit, useIsAuditeur } from './useAudit';
import { useUpdateActionAuditStatut } from './useUpdateActionAuditStatut';

export type TActionAuditStatutProps = {
  action: ActionDefinitionSummary;
  className?: string;
};

export type TActionAuditStatutBaseProps = {
  auditStatut: TActionAuditStatut;
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
        onChange={(v) => onChange(v as TAuditStatut)}
        valueToBadgeState={statusToState}
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
  const { data: auditStatut } = useActionAuditStatut(action);

  // fonction d'enregistrement des modifications
  const { mutate } = useUpdateActionAuditStatut();
  const handleChange = (statut: TAuditStatut) =>
    auditStatut && mutate({ ...auditStatut, statut });

  return audit && auditStatut ? (
    <ActionAuditStatutBase
      auditStatut={auditStatut}
      readonly={!isAuditeur || audit?.valide}
      onChange={handleChange}
      className={className}
    />
  ) : null;
};

export default ActionAuditStatut;
