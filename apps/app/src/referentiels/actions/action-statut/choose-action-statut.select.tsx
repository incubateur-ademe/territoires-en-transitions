import { avancementToLabel } from '@/app/app/labels';
import {
  StatutAvancementCreate,
  StatutAvancementEnum,
  statutAvancementEnumCreateSchema,
} from '@tet/domain/referentiels';
import { BadgeSize, Select, SelectProps } from '@tet/ui';
import ActionStatutBadge from './action-statut.badge';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  value?: StatutAvancementCreate | null;
  onChange: (statut: StatutAvancementCreate) => void;
  badgeSize?: BadgeSize;
};

const statutAvancementsToSelectOptions = (items: StatutAvancementCreate[]) =>
  items.map((value) => ({ value, label: avancementToLabel[value] }));

export const DEFAULT_OPTIONS = statutAvancementsToSelectOptions(
  statutAvancementEnumCreateSchema.options
);

export const ChooseActionStatutSelect = (props: Props) => {
  const { value, onChange, openState, badgeSize } = props;

  const options = DEFAULT_OPTIONS;
  const currentValue = value ?? StatutAvancementEnum.NON_RENSEIGNE;

  return (
    <Select
      {...props}
      dataTest="ChooseActionStatutSelect"
      values={currentValue}
      options={options}
      onChange={(v) => onChange(v as StatutAvancementCreate)}
      openState={openState}
      customItem={(item) => (
        <ActionStatutBadge
          statut={item.value as StatutAvancementCreate}
          size={badgeSize}
        />
      )}
    />
  );
};
