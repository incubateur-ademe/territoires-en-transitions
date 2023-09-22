'use client';

import {FeatureGroup, GeoJSON, Popup, Tooltip} from 'react-leaflet';
import {GeoJsonObject} from 'geojson';
import {Database, Json} from '../../app/database.types';
import {PathOptions} from 'leaflet';
import {useRouter} from 'next/navigation';
import {convertNameToSlug} from 'app/utils';

type labellisation_w_geojson =
  Database['public']['Views']['site_labellisation']['Row'] & {geojson?: Json};

type CollectiviteFeatureProps = {
  collectivite: labellisation_w_geojson;
};

/**
 * Une feature est un élément affiché dans une carte
 */
const CollectiviteFeature = ({collectivite}: CollectiviteFeatureProps) => {
  const router = useRouter();
  const geojson = collectivite.geojson as unknown as GeoJsonObject;
  const style: PathOptions = collectivite.labellisee
    ? {
        fillColor: '#4D75AC',
        fillOpacity: 0.7,
        color: '#4D75AC',
        weight: 1.5,
      }
    : {
        fillColor: '#9E9E9E',
        fillOpacity: 0.7,
        color: '#9E9E9E',
        weight: 1.5,
      };

  return (
    <FeatureGroup key={collectivite.collectivite_id}>
      <GeoJSON
        data={geojson}
        style={style}
        eventHandlers={{
          click: () => {
            router.push(
              `/collectivite/${
                collectivite.code_siren_insee
              }/${convertNameToSlug(collectivite.nom ?? '')}`,
            );
          },
        }}
      />
      <Tooltip>
        <p className="mb-0">{collectivite.nom}</p>
      </Tooltip>
    </FeatureGroup>
  );
};

export default CollectiviteFeature;
