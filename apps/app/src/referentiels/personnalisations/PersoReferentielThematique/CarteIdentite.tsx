/**
 * Affiche les informations administratives d'une collectivité
 */

import { TCarteIdentite } from './useCarteIdentite';

export type TCarteIdentiteProps = {
  identite: TCarteIdentite;
};

export const CarteIdentite = (props: TCarteIdentiteProps) => {
  const { identite } = props;
  const {
    code_siren_insee,
    departement_name,
    nom,
    population_source,
    population_totale,
    region_name,
    type_collectivite,
  } = identite;

  const items = [
    { title: 'Nom', value: nom },
    { title: 'Type de collectivité', value: type_collectivite },
    { title: 'Code SIREN ou INSEE', value: code_siren_insee },
    { title: 'Région', value: region_name },
    {
      title: `Population (${population_source})`,
      value: `${population_totale?.toLocaleString()} habitants`,
    },
    { title: 'Département', value: departement_name },
  ];

  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      {items.map((item) => (
        <Item key={item.title} title={item.title} value={item.value} />
      ))}
    </div>
  );
};

const Item = ({ title, value }: { title: string; value: string | null }) => (
  <div>
    <span className="font-bold">{title}</span>
    <br />
    {value}
  </div>
);
