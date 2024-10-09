'use client';

import CollectiviteFeature from './CollectiviteFeature';
import RegionFeature from './RegionFeature';
import CarteContainer from './CarteContainer';
import {
  labellisation_w_geojson,
  region_w_geojson,
  useCarteCollectivitesEngagees,
} from './useCarteCollectivitesEngagees';
import { useEffect, useState } from 'react';

export type FiltresLabels =
  | 'toutes'
  | 'labellisees_cae'
  | 'labellisees_eci'
  | 'cot'
  | 'actives';

type CarteCollectivitesProps = {
  filtre: FiltresLabels;
  etoiles: number[];
  forcedZoom?: number;
};

const CarteCollectivites = ({
  filtre,
  etoiles,
  forcedZoom,
}: CarteCollectivitesProps) => {
  const { data, isLoading } = useCarteCollectivitesEngagees();
  const [localData, setLocalData] = useState(data);

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
    const processData = (
      data:
        | {
            collectivites: labellisation_w_geojson[];
            regions: region_w_geojson[];
          }
        | null
        | undefined
    ) => {
      if (data) {
        return {
          collectivites: sortCollectivites(data.collectivites),
          regions: data.regions,
        };
      }
      return data;
    };

    setLocalData(processData(data));
  }, [data]);

  useEffect(() => {
    if (data) {
      let tempCollectivites = data.collectivites;
      if (filtre === 'labellisees_cae')
        tempCollectivites = tempCollectivites.filter(
          (c) => c.cae_etoiles && etoiles.includes(c.cae_etoiles)
        );
      if (filtre === 'labellisees_eci')
        tempCollectivites = tempCollectivites.filter(
          (c) => c.eci_etoiles && etoiles.includes(c.eci_etoiles)
        );
      if (filtre === 'cot')
        tempCollectivites = tempCollectivites.filter((c) => c.cot === true);
      setLocalData((prevData) => {
        if (!prevData) return prevData;
        else
          return {
            ...prevData,
            collectivites: sortCollectivites(tempCollectivites),
          };
      });
    }
  }, [filtre, etoiles, data]);

  if (isLoading)
    return (
      <div className="text-grey-8 flex items-center justify-center mx-auto max-md:my-9 md:my-20">
        <p>Chargement...</p>
      </div>
    );

  if (!localData) return null;

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
