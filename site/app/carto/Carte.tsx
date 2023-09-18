'use client';
import {MapContainer, TileLayer, useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import {ReactNode} from 'react';

/**
 * Permet d'utiliser l'objet map dans la console
 * todo à supprimer
 */
function Debugger() {
  const map = useMap();
  // @ts-ignore
  window['map'] = map;
  return null;
}

/**
 * Une carte centrée sur la France et basée sur Leaflet.
 *
 * Utiliser un import dynamique pour ne charger le composant
 * que dans le navigateur et éviter le SSR.
 *
 * @example
 * const CarteNoSSR = dynamic(() => import('./Carte'), {ssr: false})
 *
 */
function Carte(props: {children: ReactNode}) {
  return (
    <MapContainer
      center={[46.5, 2.3]}
      zoom={5.7}
      zoomSnap={0.1}
      scrollWheelZoom={false}
      style={{height: 600, background: '#d9efff'}}
      className="aspect-square"
    >
      <Debugger />
      {props.children}
    </MapContainer>
  );
}

export default Carte;
