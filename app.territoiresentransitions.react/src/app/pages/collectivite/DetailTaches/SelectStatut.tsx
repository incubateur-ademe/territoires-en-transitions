import SelectDropdown from 'ui/shared/select/SelectDropdown';
import ActionStatutBadge from 'ui/shared/actions/ActionStatutBadge';
import {ActionAvancement} from 'generated/dataLayer/action_statut_read';

export type TSelectStatutProps = {
  className?: string;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
};

export const ITEMS: {value: ActionAvancement; label: string}[] = [
  {
    value: 'non_renseigne',
    label: 'Non renseigné',
  },
  {
    value: 'pas_fait',
    label: 'Pas fait',
  },
  {
    value: 'programme',
    label: 'Programmé',
  },
  {
    value: 'detaille',
    label: 'Détaillé',
  },
  {
    value: 'fait',
    label: 'Fait',
  },
];

/**
 * Affiche le filtre par statuts
 */
export const SelectStatut = (props: TSelectStatutProps) => {
  const {value, onChange} = props;

  return (
    <SelectDropdown
      value={value}
      options={ITEMS}
      onSelect={onChange}
      buttonClassName="px-2 py-1"
      renderOption={option => (
        <ActionStatutBadge statut={option as ActionAvancement} small />
      )}
      renderSelection={value => (
        <ActionStatutBadge
          statut={value as ActionAvancement}
          small
          className="mr-auto"
        />
      )}
    />
  );
};
