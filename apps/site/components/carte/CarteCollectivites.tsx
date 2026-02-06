'use client';

import { useEffect, useEffectEvent, useState } from 'react';
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

const CarteCollectivites = ({
  filtre,
  etoiles,
  forcedZoom,
  data,
}: CarteCollectivitesProps) => {
  const [localData, setLocalData] = useState(data);
  const updateLocalData = useEffectEvent(
    (
      value:
        | CollectivitesCarteFrance
        | ((prevData: CollectivitesCarteFrance) => CollectivitesCarteFrance)
    ) => setLocalData(value)
  );

  const sortCollectivites = (collectivites: labellisation_w_geojson[]) => {
    return collectivites.sort((a, b) => {
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

  useEffect(() => {
    const processData = (data: CollectivitesCarteFrance) => {
      if (data) {
        return {
          collectivites: sortCollectivites(data.collectivites),
          regions: data.regions,
        };
      }
      return data;
    };

    updateLocalData(processData(data));
  }, [data]);

  useEffect(() => {
    let tempCollectivites = data.collectivites;
    if (filtre === 'labellisees_cae')
      tempCollectivites = tempCollectivites.filter(
        (c) => c.cae_etoiles && etoiles.includes(c.cae_etoiles)
      );
    if (filtre === 'labellisees_eci')
      tempCollectivites = tempCollectivites.filter(
        (c) => c.eci_etoiles && etoiles.includes(c.eci_etoiles)
      );
    if (filtre === 'cot_non_labellisees')
      tempCollectivites = tempCollectivites.filter(
        (c) => c.cot === true && c.labellisee === false
      );
    updateLocalData((prevData) => {
      if (!prevData) return prevData;
      else
        return {
          ...prevData,
          collectivites: sortCollectivites(tempCollectivites),
        };
    });
  }, [filtre, etoiles, data]);

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
