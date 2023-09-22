'use client';

import CollectiviteFeature from './CollectiviteFeature';
import RegionFeature from './RegionFeature';
import CarteContainer from './CarteContainer';
import {useCarteCollectivitesEngagees} from './useCarteCollectivitesEngagees';
import {useEffect, useState} from 'react';

export type FiltresLabels =
  | 'engagees'
  | 'labellisees_eci'
  | 'labellisees_cae'
  | 'cot';

type CarteCollectivitesProps = {
  filtre: FiltresLabels;
  etoiles: number[];
};

const CarteCollectivites = ({filtre, etoiles}: CarteCollectivitesProps) => {
  const {data} = useCarteCollectivitesEngagees();
  const [localData, setLocalData] = useState(data);

  useEffect(() => setLocalData(data), [data]);

  useEffect(() => {
    if (data) {
      let tempCollectivites = data.collectivites;
      if (filtre === 'labellisees_cae')
        tempCollectivites = tempCollectivites.filter(
          c => c.cae_etoiles && etoiles.includes(c.cae_etoiles),
        );
      if (filtre === 'labellisees_eci')
        tempCollectivites = tempCollectivites.filter(
          c => c.eci_etoiles && etoiles.includes(c.eci_etoiles),
        );
      if (filtre === 'cot')
        tempCollectivites = tempCollectivites.filter(c => c.cot === true);
      setLocalData(prevData => {
        if (!prevData) return prevData;
        else return {...prevData, collectivites: tempCollectivites};
      });
    }
  }, [filtre, etoiles, data]);

  if (!localData) return null;

  return (
    <CarteContainer>
      {localData.regions
        .filter(r => !!r.geojson)
        .map(r => (
          <RegionFeature region={r} key={r.insee} />
        ))}
      {localData.collectivites
        .filter(c => !!c.geojson)
        .map(c => (
          <CollectiviteFeature collectivite={c} key={c.collectivite_id} />
        ))}
    </CarteContainer>
  );
};

export default CarteCollectivites;
