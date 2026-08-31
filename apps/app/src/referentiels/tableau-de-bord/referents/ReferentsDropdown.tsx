import { Membre } from '@/app/collectivites/membres/list-membres/use-list-membres';
import { appLabels } from '@/app/labels/catalog';
import { Option, SelectFilter, SelectMultipleProps } from '@tet/ui';

type Props = Omit<SelectMultipleProps, 'values' | 'options'> & {
  membres: Membre[];
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
      placeholder={appLabels.placeholderRecherchezMotsCles}
      options={options}
      values={values}
      onChange={props.onChange}
    />
  );
};

export default ReferentsDropdown;
