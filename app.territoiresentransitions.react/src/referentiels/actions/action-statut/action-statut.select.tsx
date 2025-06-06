import { avancementToLabel } from '@/app/app/labels';
import SelectDropdown from '@/app/ui/shared/select/SelectDropdown';
import {
  statutAvancementEnumSchema,
  StatutAvancementIncludingNonConcerne,
  statutAvancementIncludingNonConcerneEnumSchema,
} from '@/domain/referentiels';
import classNames from 'classnames';
import ActionStatutBadge from './action-statut.badge';

export type TSelectActionStatutProps = {
  // item sélectionné (`non_renseigne` si `undefined` ou `null`)
  value: StatutAvancementIncludingNonConcerne | undefined | null;
  // appelée quand la sélection change
  onChange: (value: StatutAvancementIncludingNonConcerne) => void;
  // mode "lecture seule"
  disabled?: boolean;
  // pour afficher une liste différente d'items (`DEFAULT_ITEMS` si non spécifié)
  items?: StatutAvancementIncludingNonConcerne[];
  buttonClassName?: string;
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
  const { value, onChange, disabled, items, buttonClassName } = props;

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
    <SelectDropdown
      data-test="SelectStatut"
      value={currentValue}
      options={options}
      onSelect={onChange}
      buttonClassName={classNames(
        'min-w-5rem !w-fit p-0 !bg-transparent',
        buttonClassName
      )}
      renderOption={(option) => (
        <ActionStatutBadge
          statut={option.value as StatutAvancementIncludingNonConcerne}
        />
      )}
      renderSelection={(value) => (
        <ActionStatutBadge statut={value} className="mt-1" />
      )}
      required
    />
  );
};
