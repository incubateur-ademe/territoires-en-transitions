import SelectDropdown from '@/app/ui/shared/select/SelectDropdown';
import { BadgeAuditStatut } from './BadgeAuditStatut';

import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { TActionAuditStatut, TAuditStatut } from './types';
import { useActionAuditStatut } from './useActionAuditStatut';
import { useAudit, useIsAuditeur } from './useAudit';
import { useUpdateActionAuditStatut } from './useUpdateActionAuditStatut';

export type TActionAuditStatutProps = {
  action: ActionDefinitionSummary;
};

export type TActionAuditStatutBaseProps = {
  auditStatut: TActionAuditStatut;
  readonly: boolean;
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
  const { auditStatut, readonly, onChange } = props;
  const { statut } = auditStatut;
  return (
    <div className="px-2 mt-4 w-full bg-primary-2">
      {readonly ? (
        <div className="py-2" data-test="action-audit-statut-ro">
          <BadgeAuditStatut statut={statut} />
        </div>
      ) : (
        <div className="w-52">
          <SelectDropdown
            data-test="action-audit-statut"
            value={statut}
            options={options}
            onSelect={onChange}
            renderOption={(option) => (
              <BadgeAuditStatut statut={option.value as TAuditStatut} />
            )}
            renderSelection={(statut) => <BadgeAuditStatut statut={statut} />}
            buttonClassName="w-full"
          />
        </div>
      )}
    </div>
  );
};

/**
 * Charge les données et fait le rendu
 */
const ActionAuditStatut = (props: TActionAuditStatutProps) => {
  const { action } = props;

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
    />
  ) : null;
};

export default ActionAuditStatut;
