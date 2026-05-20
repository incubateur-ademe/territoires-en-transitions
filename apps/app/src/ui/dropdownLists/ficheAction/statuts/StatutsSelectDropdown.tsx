import { appLabels } from '@/app/labels/catalog';
import FicheStatutBadge from '@/app/plans/fiches/show-fiche/components/fiche-statut.badge';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { SizeVariant } from '@tet/design-tokens';
import { Statut } from '@tet/domain/plans';
import { Select, SelectProps } from '@tet/ui';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: Statut | null;
  onChange: (statut: Statut) => void;
  badgeSize?: SizeVariant;
};

const StatutsSelectDropdown = (props: Props) => {
  return (
    <Select
      {...props}
      values={props.values ?? undefined}
      dataTest={props.dataTest ?? 'statuts'}
      options={ficheActionStatutOptions}
      onChange={(statut) => props.onChange(statut as Statut)}
      placeholder={appLabels.placeholderSelectionnezStatut}
      custom={{
        renderOptionItem: (item) => (
          <FicheStatutBadge
            statut={item.value as Statut}
            size={props.badgeSize}
          />
        ),
      }}
    />
  );
};

export default StatutsSelectDropdown;
