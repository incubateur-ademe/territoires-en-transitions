'use client';

import { CollectivitesCarteFrance } from '@/site/components/carte/useCarteCollectivitesEngagees';
import Section from '@/site/components/sections/Section';
import { Divider } from '@/ui';
import classNames from 'classnames';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { FiltresLabels } from '../../components/carte/CarteCollectivites';
import FiltreEtoiles from './FiltreEtoiles';
import FiltreLabels from './FiltreLabels';

type Props = {
  data?: CollectivitesCarteFrance | null;
};

const CarteAvecFiltres = ({ data }: Props) => {
  const [filtre, setFiltre] = useState<FiltresLabels>('toutes');
  const [etoiles, setEtoiles] = useState<number[]>([1, 2, 3, 4, 5]);
  const [windowWidth, setWindowWidth] = useState<number | undefined>();

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

  return (
    <Section containerClassName="!pt-0 mt-12">
      <div>
        <p className="text-center text-grey-8 text-2xl mb-2">
          Ou parcourez notre carte interactive
        </p>

        <p className="text-center text-info-1 italic text-sm mb-0">
          Cliquez sur les collectivités labellisées pour découvrir leur page
          personnalisée
        </p>
      </div>
      <div className="flex flex-col lg:flex-row justify-between mt-8">
        <div
          className="w-full md:w-[700px] md:h-[700px] lg:w-[550px] lg:h-[550px] xl:w-[700px] xl:h-[700px] mx-auto"
          style={
            windowWidth && windowWidth < 768 ? { height: windowWidth } : {}
          }
        >
          {data && (
            <CarteCollectivites data={data} filtre={filtre} etoiles={etoiles} />
          )}
        </div>

        <div className="flex flex-col items-start justify-start gap-11 mt-11 max-lg:px-4 w-[400px] max-lg:w-full">
          <FiltreLabels
            selectedFilter={filtre}
            onChangeFilter={(filtre) => {
              setFiltre(filtre);
              setEtoiles([1, 2, 3, 4, 5]);
            }}
          />

          <div
            className={classNames('w-full', {
              hidden:
                filtre !== 'toutes' &&
                filtre !== 'labellisees_cae' &&
                filtre !== 'labellisees_eci',
            })}
          >
            <Divider className="mb-5" />

            {(filtre === 'labellisees_cae' || filtre === 'labellisees_eci') && (
              <div className="flex flex-col items-start w-full md:w-fit lg:w-full">
                <p className="text-primary-8">
                  Je filtre par niveau de labellisation :
                </p>
                <FiltreEtoiles
                  initEtoiles={etoiles}
                  onChangeEtoiles={setEtoiles}
                />
              </div>
            )}

            {filtre === 'toutes' && (
              <div className="flex flex-col gap-4 text-grey-9 text-sm">
                <div className="flex gap-3">
                  <div className="bg-[#5575A8] h-4 w-7 my-0.5 rounded-full shrink-0" />
                  <div>
                    <span className="font-bold">Collectivités engagées</span>
                    <br />
                    labellisées sur au moins un des deux référentiels ou
                    engagées non labellisées
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-[#9E9E9E] h-4 w-7 rounded-full shrink-0" />
                  <div className="font-bold">
                    Collectivités non engagées utilisatrices de la plateforme
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default CarteAvecFiltres;
