'use client';

import {FeatureGroup, GeoJSON, useMap} from 'react-leaflet';
import {GeoJsonObject} from 'geojson';
import {Database, Json} from '../database.types';

type region_w_geojson = Database['public']['Views']['site_region']['Row'] & {
  geojson?: Json;
};

export function RegionFeature(props: {item: region_w_geojson}) {
  const {item} = props;
  const geojson = item.geojson as unknown as GeoJsonObject;
  const style = {
    fillOpacity: 1,
    fillColor: 'rgb(232,229,224)',
    color: 'rgb(148,142,129)',
  };

  return (
    <FeatureGroup key={item.insee}>
      <GeoJSON data={geojson} style={style} />
    </FeatureGroup>
  );
}
