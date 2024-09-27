'use client';

import { FeatureGroup, GeoJSON } from 'react-leaflet';
import { Views, Json } from '@tet/api';
import { PathOptions } from 'leaflet';
import { GeoJsonObject } from 'geojson';

type region_w_geojson = Views<'site_region'> & {
  geojson?: Json;
};

type RegionFeatureProps = {
  region: region_w_geojson;
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
