import { Option, SelectFilter, SelectMultipleProps } from '@tet/ui';

import { CollectiviteMembre } from './useMembres';

type Props = Omit<SelectMultipleProps, 'values' | 'options'> & {
  membres: CollectiviteMembre[];
};

/** Sélecteur de membres référents de la collectivité */
const ReferentsDropdown = (props: Props) => {
  const { membres } = props;

  const options: Option[] =
    membres.map((membre) => ({
      value: membre.userId,
      label: `${membre.prenom} ${membre.nom}`,
    })) || [];

  const values = membres
    .filter((membre) => membre.estReferent)
    .map((membre) => membre.userId);

  return (
    <SelectFilter
      {...props}
      isSearcheable
      dataTest={props.dataTest ?? 'membres'}
      options={options}
      values={values}
      onChange={props.onChange}
    />
  );
};

export default ReferentsDropdown;
