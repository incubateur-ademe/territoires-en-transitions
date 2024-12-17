'use client';

import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import { CSSProperties, ReactNode, useEffect, useState } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import './style.css';

/**
 * Permet d'utiliser l'objet map dans la console
 * todo à supprimer
 */
function Debugger() {
  const map = useMap();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)['map'] = map;
  return null;
}

type CarteContainerProps = {
  children: ReactNode;
  style?: CSSProperties;
  forcedZoom?: number;
};

/**
 * Une carte centrée sur la France et basée sur Leaflet.
 *
 * Utiliser un import dynamique pour ne charger le composant
 * que dans le navigateur et éviter le SSR.
 *
 * @example
 * const CarteNoSSR = dynamic(() => import('./CarteContainer'), {ssr: false})
 *
 */

const CarteContainer = ({
  children,
  style,
  forcedZoom,
}: CarteContainerProps) => {
  const [windowWidth, setWindowWidth] = useState<number | undefined>(
    window.innerWidth
  );

  useEffect(() => {
    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
    return () =>
      window.removeEventListener('resize', () =>
        setWindowWidth(window.innerWidth)
      );
  }, []);

  return (
    <MapContainer
      center={[46.3, 2.3]}
      zoom={
        forcedZoom
          ? forcedZoom
          : windowWidth && windowWidth < 500
          ? 4.6
          : windowWidth &&
            (windowWidth < 768 || (windowWidth >= 1024 && windowWidth < 1280))
          ? 5.7
          : 6
      }
      zoomSnap={0.1}
      scrollWheelZoom={false}
      style={{ width: '100%', background: '#fff', ...style }}
      className="aspect-square"
    >
      <Debugger />
      {children}
    </MapContainer>
  );
};

export default CarteContainer;
