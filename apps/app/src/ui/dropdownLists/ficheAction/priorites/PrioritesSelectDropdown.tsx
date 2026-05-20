import FichePrioriteBadge from '@/app/plans/fiches/show-fiche/components/fiche-priorite.badge';
import { ficheActionNiveauPrioriteOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { SizeVariant } from '@tet/design-tokens';
import { Priorite } from '@tet/domain/plans';
import { Select, SelectProps } from '@tet/ui';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: Priorite | null;
  onChange: (priorite: Priorite) => void;
  badgeSize?: SizeVariant;
};

const PrioritesSelectDropdown = (props: Props) => {
  return (
    <Select
      {...props}
      values={props.values ?? undefined}
      dataTest={props.dataTest ?? 'priorites'}
      options={ficheActionNiveauPrioriteOptions}
      onChange={(priorite) => props.onChange(priorite as Priorite)}
      custom={{
        renderOptionItem: (item) => (
          <FichePrioriteBadge
            priorite={item.value as Priorite}
            size={props.badgeSize}
          />
        ),
      }}
    />
  );
};

export default PrioritesSelectDropdown;
