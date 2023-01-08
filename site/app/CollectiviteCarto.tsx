'use client';

import {
  MapContainer,
  TileLayer,
  GeoJSON
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import useSWR from 'swr';
import { supabase } from './initSupabase';

function useCarteCollectiviteActive() {
  return useSWR('stats_carte_collectivite_active', () =>
    supabase.from('stats_carte_collectivite_active').select()
  );
}

const Map = () => {
  const { data } = useCarteCollectiviteActive();
  if (!data) return null;

  // Les données geojson.
  const geo = data.data.map(d => d.geojson);

  function onEachFeature(feature, layer){
    // Bind un popup pour chaque feature lors du chargement.
    if(feature.properties) {
      // Affiche la raison sociale pour les EPCIs et le libellé pour les communes.
      layer.bindPopup(feature.properties['raison_sociale'] || feature.properties['libelle'])
    }
  }

  return (
    <MapContainer
      center={[48.833, 2.333]} zoom={5} scrollWheelZoom={false}
      style={{
        height: 100 + "%",
        width: 100 + "%",
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={geo} onEachFeature={onEachFeature} />
    </MapContainer>
  )
}

export default Map;
