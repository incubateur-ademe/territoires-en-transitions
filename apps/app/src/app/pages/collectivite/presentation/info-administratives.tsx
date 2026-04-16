'use client';

import { appLabels } from '@/app/labels/catalog';
import { useGetCollectivite } from '@/app/collectivites/collectivites/use-get-collectivite';
import { capitalize } from '@/app/utils/formatUtils';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { CollectivitePublic } from '@tet/domain/collectivites';
import { Card } from '@tet/ui';

const collectiviteNatureLabel: Record<string, string> = {
  METRO: appLabels.typeCollectiviteMetro,
  CU: appLabels.typeCollectiviteCu,
  CA: appLabels.typeCollectiviteCa,
  CC: appLabels.typeCollectiviteCc,
  SMF: appLabels.typeCollectiviteSmf,
  SMO: appLabels.typeCollectiviteSmo,
  SIVU: appLabels.typeCollectiviteSivu,
  SIVOM: appLabels.typeCollectiviteSivom,
  POLEM: appLabels.typeCollectivitePolem,
  PETR: appLabels.typeCollectivitePetr,
  EPT: appLabels.typeCollectiviteEpt,
};

/**
 * Affiche les informations administratives d'une collectivité
 */
export function InfosAdministratives() {
  const { collectiviteId } = useCurrentCollectivite();
  const { data: identite } = useGetCollectivite(collectiviteId);
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
    natureInsee,
  } = identite;

  const codeSirenInsee = communeCode ?? siren ?? '';

  return [
    { title: 'Nom', value: nom },
    natureInsee
      ? {
          title: 'Nature juridique',
          value: collectiviteNatureLabel[natureInsee]
            ? `${collectiviteNatureLabel[natureInsee]} (${natureInsee})`
            : natureInsee,
        }
      : {
          title: 'Type',
          value: capitalize(type),
        },
    { title: 'Code SIREN ou INSEE', value: codeSirenInsee },
    { title: 'Département', value: departementName ?? null },
    { title: 'Région', value: regionName ?? null },
    {
      title: populationSource
        ? `Population (${populationSource})`
        : 'Population',
      value: population ? `${population.toLocaleString()} habitants` : null,
    },
  ];
}
