import { ficheActionNoteDeSuiviOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Select, SelectProps } from '@/ui';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
};

const NoteDeSuiviDropdown = (props: Props) => {
  return (
    <Select
      {...props}
      values={
        props.values === undefined
          ? undefined
          : props.values
          ? 'Fiches avec notes de suivi'
          : 'Fiches sans notes de suivi'
      }
      dataTest={props.dataTest ?? 'noteDeSuivi'}
      options={ficheActionNoteDeSuiviOptions}
      onChange={(value) => {
        props.onChange(
          value
            ? value === 'Fiches avec notes de suivi'
              ? true
              : false
            : undefined
        );
      }}
    />
  );
};

export default NoteDeSuiviDropdown;
