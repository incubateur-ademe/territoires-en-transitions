/* eslint-disable react/no-unescaped-entities */
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { FiltresLabels } from '../../components/carte/CarteCollectivites';
import FiltreEtoiles from './FiltreEtoiles';
import FiltreLabels from './FiltreLabels';
import { Divider } from '@tet/ui';
import classNames from 'classnames';

const CarteAvecFiltres = () => {
  const [filtre, setFiltre] = useState<FiltresLabels | null>(null);
  const [etoiles, setEtoiles] = useState<number[]>([1, 2, 3, 4, 5]);
  const [windowWidth, setWindowWidth] = useState<number | undefined>();

  useEffect(() => setFiltre('toutes'), []);

  useEffect(() => {
    setWindowWidth(window.innerWidth);

    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
    return () =>
      window.removeEventListener('resize', () =>
        setWindowWidth(window.innerWidth)
      );
  }, []);

  const CarteCollectivites = dynamic(
    () => import('../../components/carte/CarteCollectivites'),
    {
      ssr: false,
      loading: () => (
        <div className="text-grey-8 flex items-center justify-center mx-auto max-md:my-9 md:my-20">
          <p>Chargement...</p>
        </div>
      ),
    }
  );
  return filtre ? (
    <div className="flex flex-col lg:flex-row justify-between mt-8">
      <div
        className="w-full md:w-[700px] md:h-[700px] lg:w-[550px] lg:h-[550px] xl:w-[700px] xl:h-[700px] mx-auto"
        style={windowWidth && windowWidth < 768 ? { height: windowWidth } : {}}
      >
        <CarteCollectivites filtre={filtre} etoiles={etoiles} />
      </div>

      <div className="flex flex-col items-start justify-start mt-11 max-lg:px-4">
        <div className="flex flex-col md:flex-row lg:flex-col md:max-lg:items-center justify-around gap-8 w-full mb-11">
          <FiltreLabels
            selectedFilter={filtre}
            onChangeFilter={(filtre) => {
              setFiltre(filtre);
              setEtoiles([1, 2, 3, 4, 5]);
            }}
          />

          <div
            className={classNames(
              'flex flex-col items-start w-full md:w-fit lg:w-full',
              {
                'max-lg:invisible lg:hidden':
                  filtre !== 'labellisees_cae' && filtre !== 'labellisees_eci',
              }
            )}
          >
            <p className="text-primary-8">
              Je filtre par niveau de labellisation :
            </p>
            <FiltreEtoiles initEtoiles={etoiles} onChangeEtoiles={setEtoiles} />
          </div>
        </div>

        <Divider className="mb-5" />

        <div className="flex flex-col gap-4 text-grey-9 text-sm lg:w-[400px]">
          <div className="flex gap-3">
            <div className="bg-[#5575A8] h-4 w-7 my-0.5 rounded-full shrink-0" />
            <div>
              <span className="font-bold">
                Collectivités engagées labellisées et non labellisées
              </span>
              <br />
              labellisées sur au moins un des deux référentiels et engagées non
              labellisées
            </div>
          </div>
          <div className="flex gap-3">
            <div className="bg-[#9E9E9E] h-4 w-7 rounded-full shrink-0" />
            <div className="font-bold">
              Collectivités utilisatrices de la plateforme
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default CarteAvecFiltres;
