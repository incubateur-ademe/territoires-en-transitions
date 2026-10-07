'use client';

import { useMemo } from 'react';
import CarteContainer from './CarteContainer';
import CollectiviteFeature from './CollectiviteFeature';
import RegionFeature from './RegionFeature';
import { SiteCarte, SiteCarteCollectivite } from '@/site/src/trpc/trpc-client';

export type FiltresLabels =
  | 'toutes'
  | 'labellisees_cae'
  | 'labellisees_eci'
  | 'cot_non_labellisees'
  | 'actives';

type CarteCollectivitesProps = {
  filtre: FiltresLabels;
  etoiles: number[];
  forcedZoom?: number;
  data: SiteCarte;
};

// `sort` sur une copie : la liste affichée est dérivée pendant le rendu, elle
// ne doit pas réordonner le tableau reçu en prop.
const sortCollectivites = (collectivites: SiteCarteCollectivite[]) => {
  return [...collectivites].sort((a, b) => {
    if (
      (a.typeCollectivite === 'syndicat' &&
        (b.typeCollectivite === 'EPCI' || b.typeCollectivite === 'commune')) ||
      (a.typeCollectivite === 'EPCI' && b.typeCollectivite === 'commune')
    )
      return -1;
    if (
      (a.typeCollectivite === 'commune' &&
        (b.typeCollectivite === 'EPCI' || b.typeCollectivite === 'syndicat')) ||
      (a.typeCollectivite === 'EPCI' && b.typeCollectivite === 'syndicat')
    )
      return 1;
    return 0;
  });
};

const CarteCollectivites = ({
  filtre,
  etoiles,
  forcedZoom,
  data,
}: CarteCollectivitesProps) => {
  // Le filtre et le tri sont une lecture des props : les calculer ici, plutôt
  // que de les recopier dans un état via deux effets, évite le rendu
  // intermédiaire où la carte affichait encore les collectivités précédentes.
  const localData = useMemo(() => {
    let collectivites = data.collectivites;
    if (filtre === 'labellisees_cae')
      collectivites = collectivites.filter(
        (c) => c.caeEtoiles && etoiles.includes(c.caeEtoiles)
      );
    if (filtre === 'labellisees_eci')
      collectivites = collectivites.filter(
        (c) => c.eciEtoiles && etoiles.includes(c.eciEtoiles)
      );
    if (filtre === 'cot_non_labellisees')
      collectivites = collectivites.filter(
        (c) => c.cot === true && c.labellisee === false
      );
    return {
      ...data,
      collectivites: sortCollectivites(collectivites),
    };
  }, [data, filtre, etoiles]);

  return (
    <CarteContainer forcedZoom={forcedZoom}>
      {localData.regions
        .filter((r) => !!r.geojson)
        .map((r) => (
          <RegionFeature region={r} key={r.insee} />
        ))}
      {localData.collectivites
        .filter((c) => !!c.geojson)
        .map((c) => (
          <CollectiviteFeature collectivite={c} key={c.collectiviteId} />
        ))}
    </CarteContainer>
  );
};

export default CarteCollectivites;
