import { avancementToLabel } from '@/app/app/labels';
import {
  statutAvancementEnumSchema,
  StatutAvancementIncludingNonConcerne,
  statutAvancementIncludingNonConcerneEnumSchema,
} from '@/domain/referentiels';
import { SelectBadge } from '@/ui';
import ActionStatutBadge, { statusToState } from './action-statut.badge';

export type TSelectActionStatutProps = {
  // item sélectionné (`non_renseigne` si `undefined` ou `null`)
  value: StatutAvancementIncludingNonConcerne | undefined | null;
  // appelée quand la sélection change
  onChange: (value: StatutAvancementIncludingNonConcerne) => void;
  // mode "lecture seule"
  disabled?: boolean;
  // pour afficher une liste différente d'items (`DEFAULT_ITEMS` si non spécifié)
  items?: StatutAvancementIncludingNonConcerne[];
};

// transforme une liste de statuts en options pour la liste déroulante
const getOptions = (items: StatutAvancementIncludingNonConcerne[]) =>
  items.map((value) => ({ value, label: avancementToLabel[value] }));

export const DEFAULT_OPTIONS = getOptions(statutAvancementEnumSchema.options);

export const DEFAULT_OPTIONS_WITH_NON_CONCERNE = getOptions(
  statutAvancementIncludingNonConcerneEnumSchema.options
);

/**
 * Affiche le sélecteur de statut d'une action
 */
export const SelectActionStatut = (props: TSelectActionStatutProps) => {
  const { value, onChange, disabled, items } = props;

  const options = items ? getOptions(items) : DEFAULT_OPTIONS;
  const currentValue = value || 'non_renseigne';

  if (disabled) {
    return (
      <ActionStatutBadge
        statut={currentValue as StatutAvancementIncludingNonConcerne}
      />
    );
  }

  return (
    <SelectBadge
      dataTest="SelectStatut"
      defaultValue={currentValue}
      values={currentValue}
      options={options}
      onChange={(v) => onChange(v as StatutAvancementIncludingNonConcerne)}
      valueToBadgeState={statusToState}
      dropdownZindex={801}
    />
  );
};
