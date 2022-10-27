import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {Badge, TBadgeProps} from 'ui/shared/Badge';
import {SelectDropdownCustom} from 'ui/shared/SelectDropdown';
import {TActionAuditStatut, TAuditStatut} from './types';
import {useActionAuditStatut} from './useActionAuditStatut';
import {useAudit, useIsAuditeur} from './useAudit';
import {useUpdateActionAuditStatut} from './useUpdateActionAuditStatut';

export type TActionAuditStatutProps = {
  action: ActionDefinitionSummary;
};

export type TActionAuditStatutBaseProps = {
  auditStatut: TActionAuditStatut;
  readonly: boolean;
  onChange: (newStatut: TAuditStatut) => void;
};

const statutToOption: Record<
  TAuditStatut,
  {label: string; badge: TBadgeProps['status']}
> = {
  non_audite: {label: 'Non audité', badge: 'warning'},
  en_cours: {label: 'Audit en cours', badge: 'info'},
  audite: {label: 'Audité', badge: 'success'},
};

const options: TAuditStatut[] = ['non_audite', 'en_cours', 'audite'];

/**
 * Affiche le sélecteur de statut d'audit d'une action
 */
export const ActionAuditStatutBase = (props: TActionAuditStatutBaseProps) => {
  const {auditStatut, readonly, onChange} = props;
  const {statut} = auditStatut;
  return (
    <div className="px-2 w-full bg-[#e8edff]">
      {readonly ? (
        <div className="py-2" data-test="action-audit-statut-ro">
          <BadgeStatut statut={statut} />
        </div>
      ) : (
        <div className="w-52">
          <SelectDropdownCustom
            data-test="action-audit-statut"
            options={options}
            displayOption={statut => <BadgeStatut statut={statut} />}
            value={statut}
            onSelect={onChange}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Affiche un badge représentant un statut d'audit
 */
const BadgeStatut = ({statut}: {statut: TAuditStatut}) => {
  const {label, badge} = statutToOption[statut];
  return (
    <Badge status={badge} className="fr-badge--no-icon">
      {label}
    </Badge>
  );
};

/**
 * Charge les données et fait le rendu
 */
const ActionAuditStatut = (props: TActionAuditStatutProps) => {
  const {action} = props;

  // donnée de l'audit en cours (si il y en a un)
  const {data: audit} = useAudit();

  // indique si l'utilisateur courant est l'auditeur
  const isAuditeur = useIsAuditeur();

  // statut d'audit de l'action
  const {data: auditStatut} = useActionAuditStatut(action);

  // fonction d'enregistrement des modifications
  const {mutate} = useUpdateActionAuditStatut();
  const handleChange = (statut: TAuditStatut) =>
    auditStatut && mutate({...auditStatut, statut});

  return audit && auditStatut ? (
    <ActionAuditStatutBase
      auditStatut={auditStatut}
      readonly={!isAuditeur}
      onChange={handleChange}
    />
  ) : null;
};

export default ActionAuditStatut;
