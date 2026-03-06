/**
 * Affiche les informations administratives d'une collectivité
 */

import { CollectivitePublic } from '@tet/domain/collectivites';

export const CarteIdentite = (props: { identite: CollectivitePublic }) => {
  const { identite } = props;
  const {
    communeCode,
    departementName,
    nom,
    population,
    populationSource,
    regionName,
    siren,
    type,
  } = identite;

  const codeSirenInsee = communeCode ?? siren ?? '';

  const items = [
    { title: 'Nom', value: nom },
    { title: 'Type de collectivité', value: type },
    { title: 'Code SIREN ou INSEE', value: codeSirenInsee },
    { title: 'Région', value: regionName ?? null },
    {
      title: `Population (${populationSource ?? ''})`,
      value: `${population?.toLocaleString() ?? 0} habitants`,
    },
    { title: 'Département', value: departementName ?? null },
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
