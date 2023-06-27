import {TActionAvancement, TActionAvancementExt} from 'types/alias';
import SelectDropdown from 'ui/shared/select/SelectDropdown';
import {avancementToLabel} from 'app/labels';
import ActionStatutBadge from './ActionStatutBadge';

export type TSelectActionStatutProps = {
  // item sélectionné (`non_renseigne` si `undefined` ou `null`)
  value: TActionAvancementExt | undefined | null;
  // appelée quand la sélection change
  onChange: (value: TActionAvancementExt) => void;
  // mode "lecture seule"
  disabled?: boolean;
  // pour afficher une liste différente d'items (`DEFAULT_ITEMS` si non spécifié)
  items?: TActionAvancementExt[];
};

// transforme une liste de statuts en options pour la liste déroulante
const getOptions = (items: TActionAvancementExt[]) =>
  items.map(value => ({value, label: avancementToLabel[value]}));

// les items par défaut (sans le "non concerné")
export const DEFAULT_ITEMS: TActionAvancement[] = [
  'non_renseigne',
  'fait',
  'programme',
  'pas_fait',
  'detaille',
];

export const ITEMS_AVEC_NON_CONCERNE: TActionAvancementExt[] = [
  ...DEFAULT_ITEMS,
  'non_concerne',
];

export const DEFAULT_OPTIONS = getOptions(DEFAULT_ITEMS);

/**
 * Affiche le sélecteur de statut d'une action
 */
export const SelectActionStatut = (props: TSelectActionStatutProps) => {
  const {value, onChange, disabled, items} = props;

  const options = items ? getOptions(items) : DEFAULT_OPTIONS;
  const currentValue = value || 'non_renseigne';

  if (disabled) {
    return (
      <ActionStatutBadge statut={currentValue as TActionAvancementExt} small />
    );
  }

  return (
    <SelectDropdown
      data-test="SelectStatut"
      value={currentValue}
      options={options}
      onSelect={onChange}
      buttonClassName="min-w-5rem w-fit p-0 !bg-transparent"
      renderOption={option => (
        <ActionStatutBadge
          statut={option.value as TActionAvancementExt}
          small
        />
      )}
      renderSelection={value => (
        <ActionStatutBadge statut={value} small className="mr-auto mt-1" />
      )}
      required
    />
  );
};
