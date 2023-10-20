/* eslint-disable react/no-unescaped-entities */
'use client';

import dynamic from 'next/dynamic';
import {useEffect, useState} from 'react';
import {FiltresLabels} from '../../components/carte/CarteCollectivites';
import FiltreEtoiles from './FiltreEtoiles';
import FiltreLabels from './FiltreLabels';

const CarteAvecFiltres = () => {
  const [filtre, setFiltre] = useState<FiltresLabels | null>(null);
  const [etoiles, setEtoiles] = useState<number[]>([1, 2, 3, 4, 5]);
  const [windowWidth, setWindowWidth] = useState<number | undefined>();

  useEffect(() => setFiltre('engagees'), []);

  useEffect(() => {
    setWindowWidth(window.innerWidth);

    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
    return () =>
      window.removeEventListener('resize', () =>
        setWindowWidth(window.innerWidth),
      );
  }, []);

  const CarteCollectivites = dynamic(
    () => import('../../components/carte/CarteCollectivites'),
    {
      ssr: false,
      loading: () => (
        <div
          className="w-full md:w-[700px] md:h-[700px] lg:w-[550px] lg:h-[550px] xl:w-[700px] xl:h-[700px] mb-12 mx-auto flex items-center justify-center"
          style={windowWidth && windowWidth < 768 ? {height: windowWidth} : {}}
        >
          <p>Chargement...</p>
        </div>
      ),
    },
  );
  return filtre ? (
    <div className="flex flex-col lg:flex-row justify-between mt-8">
      <div
        className="w-full md:w-[700px] md:h-[700px] lg:w-[550px] lg:h-[550px] xl:w-[700px] xl:h-[700px] mx-auto"
        style={windowWidth && windowWidth < 768 ? {height: windowWidth} : {}}
      >
        <CarteCollectivites filtre={filtre} etoiles={etoiles} />
      </div>

      <div className="flex flex-col items-start justify-start gap-8">
        <div className="flex flex-col md:flex-row lg:flex-col justify-between gap-8 w-full md:px-16 lg:px-0">
          <div className="flex flex-col items-center w-full md:w-fit lg:w-full ">
            <p className="text-primary-8">
              Je découvre les collectivités engagées :
            </p>
            <FiltreLabels
              selectedFilter={filtre}
              onChangeFilter={filtre => {
                setFiltre(filtre);
                setEtoiles([1, 2, 3, 4, 5]);
              }}
            />
          </div>

          {(filtre === 'labellisees_cae' || filtre === 'labellisees_eci') && (
            <div className="flex flex-col items-center w-full md:w-fit lg:w-full">
              <p className="text-primary-8">
                Je filtre par niveau de labellisation :
              </p>
              <FiltreEtoiles
                initEtoiles={etoiles}
                onChangeEtoiles={setEtoiles}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;
};

export default CarteAvecFiltres;
