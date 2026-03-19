'use client';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { CollectivitePublic } from '@tet/domain/collectivites';
import { Card } from '@tet/ui';
import { useCollectivite } from '../personnalisations/data/use-collectivite';

/**
 * Affiche les informations administratives d'une collectivité
 */
export function InfosAdministratives() {
  const { collectiviteId } = useCurrentCollectivite();
  const { data: identite } = useCollectivite(collectiviteId);
  const items = identite ? getItems(identite) : null;

  return (
    <Card
      header={
        <>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary-9">
              Informations administratives officielles
            </span>
            <span className="text-primary-8">Non modifiable</span>
          </div>
          <div className="h-px w-full bg-grey-3 p-0 my-2" />
        </>
      }
    >
      {items ? (
        <div className="grid gap-2">
          {items.map((item) => (
            <Item key={item.title} title={item.title} value={item.value} />
          ))}
        </div>
      ) : (
        <SpinnerLoader />
      )}
    </Card>
  );
}

function Item({ title, value }: { title: string; value: string | null }) {
  return (
    <div>
      <span className="font-medium text-primary-10">{title}&nbsp;:&nbsp;</span>
      <span className="font-normal text-grey-8">{value}</span>
    </div>
  );
}

function getItems(identite: CollectivitePublic) {
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

  return [
    { title: 'Nom', value: nom },
    { title: 'Type de collectivité', value: type },
    { title: 'Code SIREN ou INSEE', value: codeSirenInsee },
    { title: 'Région', value: regionName ?? null },
    {
      title: populationSource
        ? `Population (${populationSource})`
        : 'Population',
      value: population ? `${population.toLocaleString()} habitants` : null,
    },
    { title: 'Département', value: departementName ?? null },
  ];
}
