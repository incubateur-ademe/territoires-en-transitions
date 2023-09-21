'use client';

import {FeatureGroup, GeoJSON, Popup} from 'react-leaflet';
import {GeoJsonObject} from 'geojson';
import {Database, Json} from '../database.types';

type labellisation_w_geojson =
  Database['public']['Views']['site_labellisation']['Row'] & {geojson?: Json};

/**
 * Une feature est un élément affiché dans une carte
 */
export function CollectiviteFeature(props: {item: labellisation_w_geojson}) {
  const {item} = props;
  const geojson = item.geojson as unknown as GeoJsonObject;
  const style = item.labellise
    ? {
        fillColor: '#476c9b',
        color: '#164988',
      }
    : {
        fillColor: 'rgb(152,152,152)',
        color: 'rgb(118,118,118)',
      };

  return (
    <FeatureGroup key={item.collectivite_id}>
      <GeoJSON data={geojson} style={style} />
      <Popup>
        <h4>{item.nom}</h4>
        <pre>{JSON.stringify({...item, geojson: '...'}, null, 2)}</pre>
        <button id="button" className="fr-btn rounded-lg">
          Page collectivité
        </button>
      </Popup>
    </FeatureGroup>
  );
}
