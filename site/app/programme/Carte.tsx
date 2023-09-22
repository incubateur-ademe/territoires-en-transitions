/* eslint-disable react/no-unescaped-entities */

'use client';

import ButtonWithLink from '@components/buttons/ButtonWithLink';
import {FiltresLabels} from '@components/carte/CarteCollectivites';
import FiltreLabels from '@components/carte/FiltreLabels';
import Section from '@components/sections/Section';
import {useEffect, useState} from 'react';
import dynamic from 'next/dynamic';
import FiltreEtoiles from '@components/carte/FiltreEtoiles';

const Carte = () => {
  const [filtre, setFiltre] = useState<FiltresLabels | null>(null);
  const [etoiles, setEtoiles] = useState<number[]>([1, 2, 3, 4, 5]);

  useEffect(() => setFiltre('engagees'), []);

  const CarteCollectivites = dynamic(
    () => import('../../components/carte/CarteCollectivites'),
    {
      ssr: false,
      loading: () => (
        <div className="w-full md:w-[700px] md:h-[700px] lg:w-[550px] xl:w-[700px] mb-12 mx-auto flex items-center justify-center">
          <p>Chargement...</p>
        </div>
      ),
    },
  );

  return (
    <Section id="carte" className="flex-col">
      <h3>De nombreuses collectivités ont déjà franchi le cap !</h3>
      {filtre && (
        <div className="flex flex-col lg:flex-row justify-between mt-8">
          <div className="w-full md:w-[700px] md:h-[700px] lg:w-[550px] xl:w-[700px] mb-12 mx-auto">
            <CarteCollectivites filtre={filtre} etoiles={etoiles} />
          </div>

          <div className="flex flex-col items-start justify-start gap-8">
            <div className="flex gap-4 items-center">
              <div className="bg-[#4D75AC] min-w-[40px] h-[30px] rounded-2xl"></div>
              <div className="lg:w-[350px]">
                <strong>Collectivités engagées labellisées</strong> sur au moins
                un des 2 référentiels : Climat Air Énergie (CAE) et/ou Économie
                Circulaire (ECi)
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="bg-[#9E9E9E] min-w-[40px] h-[30px] rounded-2xl"></div>
              <div className="lg:w-[350px]">
                <strong>Collectivités engagées non labellisées</strong>{' '}
                signataires d'un Contrat d'Objectif Territorial (COT)
              </div>
            </div>

            <div className="flex flex-col md:flex-row lg:flex-col justify-between gap-8 w-full md:px-16 lg:px-0">
              <div className="flex flex-col items-center w-full md:w-fit lg:w-full ">
                <p className="text-[#000091]">
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

              {(filtre === 'labellisees_cae' ||
                filtre === 'labellisees_eci') && (
                <div className="flex flex-col items-center w-full md:w-fit lg:w-full">
                  <p className="text-[#000091]">
                    Je filtre par niveau de labellisation :
                  </p>
                  <FiltreEtoiles
                    initEtoiles={etoiles}
                    onChangeEtoiles={etoiles => setEtoiles(etoiles)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ButtonWithLink href="/faq" secondary className="mt-16 mx-auto">
        Lire les questions fréquentes
      </ButtonWithLink>
    </Section>
  );
};

export default Carte;
