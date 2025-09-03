'use client';

import { useTrajectoireLeviers } from '@/app/indicateurs/trajectoire-leviers/use-trajectoire-leviers';
import { TOOLBOX_BASE } from '@/app/ui/charts/echarts';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error.card';
import { getErrorMessage } from '@/domain/utils';
import { Card } from '@/ui';
import { InputData, MondrianTreemap } from 'mondrian-treemap';
import React from 'react';

type SgpeMondrianProps = {
  selectedSecteurIdentifiant?: string;
  selectedLevier?: string;
  onSecteurIdentifiantsSelected?: (sectorIdentifiants?: string[]) => void;
  onLevierSelected?: (sector: string, lever: string) => void;
};

export const SgpeMondrian: React.FC<SgpeMondrianProps> = (
  props: SgpeMondrianProps
) => {
  const {
    selectedSecteurIdentifiant,
    selectedLevier,
    onSecteurIdentifiantsSelected,
    onLevierSelected,
  } = props;

  const { data: trajectoireLeviers, error } = useTrajectoireLeviers();

  const selectedSecteur = selectedSecteurIdentifiant
    ? `${
        trajectoireLeviers?.secteurs.find((secteur) =>
          secteur.identifiants.includes(selectedSecteurIdentifiant)
        )?.nom
      }toto`
    : undefined;

  if (!trajectoireLeviers) {
    return (
      <Card>
        <div className="h-96 flex flex-col">
          <h3 className="text-base mb-0">
            Objectifs du territoire répartis par levier
          </h3>
          <div className="flex grow flex-col items-center justify-center">
            {error ? (
              <ErrorCard
                error={error}
                title="Erreur lors du changement des données !"
                subTitle={`Erreur : ${getErrorMessage(error)}`}
              />
            ) : (
              <SpinnerLoader />
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-base mb-0">
        Objectifs du territoire répartis par levier
      </h3>
      <MondrianTreemap
        toolboxOptions={{
          ...TOOLBOX_BASE,
          top: 1,
          right: 3,
          feature: {
            saveAsImage: {
              ...TOOLBOX_BASE.feature.saveAsImage,
              name: `trajectoire-leviers-mondrian`,
            },
          },
        }}
        inputData={trajectoireLeviers as InputData}
        selectedSecteur={selectedSecteur}
        selectedLevier={selectedLevier}
        onSelected={(sector, lever) => {
          const sectorIdentifiants = trajectoireLeviers?.secteurs.find(
            (secteur) => secteur.nom === sector
          )?.identifiants;
          if (sectorIdentifiants) {
            onSecteurIdentifiantsSelected?.(sectorIdentifiants);
          } else {
            onSecteurIdentifiantsSelected?.(undefined);
          }
          onLevierSelected?.(sector, lever);
        }}
        displayErrorModal={(error) => {
          return <ErrorCard title={error} />;
        }}
        style={{ height: '700px' }}
      />
    </Card>
  );
};
