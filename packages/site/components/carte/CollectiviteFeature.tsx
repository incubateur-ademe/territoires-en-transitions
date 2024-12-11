'use client';

import { Json, Views } from '@/api';
import { convertNameToSlug } from '@/site/src/utils/convertNameToSlug';
import { GeoJsonObject } from 'geojson';
import { PathOptions } from 'leaflet';
import { useRouter } from 'next/navigation';
import { FeatureGroup, GeoJSON, Tooltip } from 'react-leaflet';

type labellisation_w_geojson = Views<'site_labellisation'> & { geojson?: Json };

type CollectiviteFeatureProps = {
  collectivite: labellisation_w_geojson;
};

/**
 * Une feature est un élément affiché dans une carte
 */
const CollectiviteFeature = ({ collectivite }: CollectiviteFeatureProps) => {
  const router = useRouter();
  const geojson = collectivite.geojson as unknown as GeoJsonObject;

  const fillColor = collectivite.engagee ? '#5575A8' : '#9E9E9E';

  const style: PathOptions = {
    fillColor: fillColor,
    fillOpacity: 0.7,
    color: fillColor,
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
              `/collectivites/${
                collectivite.code_siren_insee
              }/${convertNameToSlug(collectivite.nom ?? '')}`
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
