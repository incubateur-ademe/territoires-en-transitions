import { avancementToLabel } from '@/app/app/labels';
import {
  statutAvancementEnumSchema,
  StatutAvancementIncludingNonConcerne,
  statutAvancementIncludingNonConcerneEnumSchema,
} from '@tet/domain/referentiels';
import { BadgeSize, Select, SelectProps } from '@tet/ui';
import ActionStatutBadge from './action-statut.badge';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  value?: StatutAvancementIncludingNonConcerne | null;
  onChange: (statut: StatutAvancementIncludingNonConcerne) => void;
  badgeSize?: BadgeSize;
};

const statutAvancementsToSelectOptions = (
  items: StatutAvancementIncludingNonConcerne[]
) => items.map((value) => ({ value, label: avancementToLabel[value] }));

export const DEFAULT_OPTIONS = statutAvancementsToSelectOptions(
  statutAvancementEnumSchema.options
);

export const DEFAULT_OPTIONS_WITH_NON_CONCERNE =
  statutAvancementsToSelectOptions(
    statutAvancementIncludingNonConcerneEnumSchema.options
  );

export const ChooseActionStatutSelect = (props: Props) => {
  const { value, onChange, openState, badgeSize } = props;

  const options = DEFAULT_OPTIONS_WITH_NON_CONCERNE;
  const currentValue = value || 'non_renseigne';

  return (
    <Select
      {...props}
      dataTest="ChooseActionStatutSelect"
      values={currentValue}
      options={options}
      onChange={(v) => onChange(v as StatutAvancementIncludingNonConcerne)}
      openState={openState}
      customItem={(item) => (
        <ActionStatutBadge
          statut={item.value as StatutAvancementIncludingNonConcerne}
          size={badgeSize}
        />
      )}
    />
  );
};
