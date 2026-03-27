import { avancementToLabel } from '@/app/app/labels';
import {
  StatutAvancementCreate,
  statutAvancementEnumCreateSchema,
} from '@tet/domain/referentiels';
import { SelectBadge } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import ActionStatutBadge, { statusToState } from './action-statut.badge';

export type TSelectActionStatutProps = {
  // item sélectionné (`non_renseigne` si `undefined` ou `null`)
  value: StatutAvancementCreate | undefined | null;
  // appelée quand la sélection change
  onChange: (value: StatutAvancementCreate) => void;
  // mode "lecture seule"
  disabled?: boolean;
  // pour afficher une liste différente d'items (`DEFAULT_ITEMS` si non spécifié)
  items?: StatutAvancementCreate[];

  openState?: OpenState;
};

// transforme une liste de statuts en options pour la liste déroulante
const getOptions = (items: StatutAvancementCreate[]) =>
  items.map((value) => ({ value, label: avancementToLabel[value] }));

export const DEFAULT_OPTIONS = getOptions(
  statutAvancementEnumCreateSchema.options
);

/**
 * Affiche le sélecteur de statut d'une action
 */
export const SelectActionStatut = (props: TSelectActionStatutProps) => {
  const { value, onChange, disabled, items, openState } = props;

  const options = items ? getOptions(items) : DEFAULT_OPTIONS;
  const currentValue = value || 'non_renseigne';

  if (disabled) {
    return <ActionStatutBadge statut={currentValue} />;
  }

  return (
    <SelectBadge
      dataTest="SelectStatut"
      defaultValue={currentValue}
      values={currentValue}
      options={options}
      onChange={(v) => onChange(v as StatutAvancementCreate)}
      valueToBadgeState={statusToState}
      dropdownZindex={801}
      openState={openState}
    />
  );
};
