'use client';
import {
  MapContainer,
  TileLayer,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import {ReactNode} from "react";

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
 */
function Carte(props: {children: ReactNode}) {
  return (
    <MapContainer
      center={[46.6, 2.2]}
      zoom={5}
      scrollWheelZoom={false}
      style={{height: 600}}
      className="aspect-square"
    >
      <Debugger />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {props.children}
    </MapContainer>
  );
}

export default Carte;
