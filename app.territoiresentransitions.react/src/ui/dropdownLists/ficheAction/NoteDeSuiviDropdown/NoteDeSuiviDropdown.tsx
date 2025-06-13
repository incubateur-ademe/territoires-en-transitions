import { ficheActionNoteDeSuiviOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { NoteDeSuivi } from '@/backend/plans/fiches/index-domain';
import { Select, SelectProps } from '@/ui';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: NoteDeSuivi;
  onChange: (value: NoteDeSuivi) => void;
};

const NoteDeSuiviDropdown = (props: Props) => {
  return (
    <Select
      {...props}
      values={props.values ?? undefined}
      dataTest={props.dataTest ?? 'noteDeSuivi'}
      options={ficheActionNoteDeSuiviOptions}
      onChange={(value) => {
        props.onChange(value as NoteDeSuivi);
      }}
    />
  );
};

export default NoteDeSuiviDropdown;
