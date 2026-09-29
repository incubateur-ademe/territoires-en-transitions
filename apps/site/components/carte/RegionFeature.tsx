'use client';

import { SiteCarteRegion } from '@/site/src/trpc/trpc-client';
import { GeoJsonObject } from 'geojson';
import { PathOptions } from 'leaflet';
import { FeatureGroup, GeoJSON } from 'react-leaflet';

type RegionFeatureProps = {
  region: SiteCarteRegion;
};

const RegionFeature = ({ region }: RegionFeatureProps) => {
  const geojson = region.geojson as unknown as GeoJsonObject;
  const style: PathOptions = {
    fillOpacity: 1,
    fillColor: '#fff',
    color: '#000',
    weight: 1,
  };

  return (
    <FeatureGroup key={region.insee}>
      <GeoJSON data={geojson} style={style} />
    </FeatureGroup>
  );
};

export default RegionFeature;
