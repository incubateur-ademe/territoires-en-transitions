import { Select, SelectProps } from '@tet/ui';

type Value = 'rempli' | 'incomplet';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: Value;
  onChange: (value: Value) => void;
};

const IndicateurCompletsDropdown = (props: Props) => {
  return (
    <Select
      {...props}
      options={[
        {
          label: 'Complet',
          value: 'rempli',
        },
        {
          label: 'Incomplet',
          value: 'incomplet',
        },
      ]}
      onChange={(value) => {
        props.onChange(value as Value);
      }}
    />
  );
};

export default IndicateurCompletsDropdown;
