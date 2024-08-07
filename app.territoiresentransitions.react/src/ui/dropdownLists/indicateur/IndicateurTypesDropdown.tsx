import {Enums} from '@tet/api';
import {TypeIndicateur} from '@tet/api/dist/src/indicateurs/domain';
import {Select, SelectProps} from '@tet/ui';

type Value = Enums<'indicateur_referentiel_type'>;

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: TypeIndicateur;
  onChange: (value?: TypeIndicateur) => void;
};

const IndicateurTypesDropdown = (props: Props) => {
  return (
    <Select
      {...props}
      options={[
        {
          label: 'Résultat',
          value: 'resultat',
        },
        {
          label: 'Impact',
          value: 'impact',
        },
      ]}
      onChange={value => {
        props.onChange(value as Value);
      }}
    />
  );
};

export default IndicateurTypesDropdown;
