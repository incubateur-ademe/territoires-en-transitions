'use client';

import { useMemo } from 'react';
import CarteContainer from './CarteContainer';
import CollectiviteFeature from './CollectiviteFeature';
import RegionFeature from './RegionFeature';
import {
  CollectivitesCarteFrance,
  labellisation_w_geojson,
} from './useCarteCollectivitesEngagees';

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
  data: CollectivitesCarteFrance;
};

// `sort` sur une copie : la liste affichée est dérivée pendant le rendu, elle
// ne doit pas réordonner le tableau reçu en prop.
const sortCollectivites = (collectivites: labellisation_w_geojson[]) => {
  return [...collectivites].sort((a, b) => {
    if (
      (a.type_collectivite === 'syndicat' &&
        (b.type_collectivite === 'EPCI' ||
          b.type_collectivite === 'commune')) ||
      (a.type_collectivite === 'EPCI' && b.type_collectivite === 'commune')
    )
      return -1;
    if (
      (a.type_collectivite === 'commune' &&
        (b.type_collectivite === 'EPCI' ||
          b.type_collectivite === 'syndicat')) ||
      (a.type_collectivite === 'EPCI' && b.type_collectivite === 'syndicat')
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
        (c) => c.cae_etoiles && etoiles.includes(c.cae_etoiles)
      );
    if (filtre === 'labellisees_eci')
      collectivites = collectivites.filter(
        (c) => c.eci_etoiles && etoiles.includes(c.eci_etoiles)
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
          <CollectiviteFeature collectivite={c} key={c.collectivite_id} />
        ))}
    </CarteContainer>
  );
};

export default CarteCollectivites;
