import { useCurrentCollectivite } from '@/api/collectivites';
import { useTrajectoireLeviers } from '@/app/indicateurs/trajectoire-leviers/use-trajectoire-leviers';
import { TOOLBOX_BASE } from '@/app/ui/charts/echarts';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { getErrorMessage } from '@/domain/utils';
import { Card, Event, preset, useEventTracker } from '@/ui';
import { MondrianTreemap } from 'mondrian-treemap';
import React from 'react';

const { colors } = preset.theme.extend;

type SgpeMondrianProps = {
  selectedSecteurIdentifiant?: string;
  selectedLevier?: string;
  onSelected?: (secteurIdentifiants?: string[], levier?: string) => void;
};

export const SgpeMondrian: React.FC<SgpeMondrianProps> = (
  props: SgpeMondrianProps
) => {
  const { selectedSecteurIdentifiant, selectedLevier, onSelected } = props;
  const { collectiviteId } = useCurrentCollectivite();
  const { data: trajectoireLeviers, error } = useTrajectoireLeviers();
  const tracker = useEventTracker();

  const selectedSecteur = selectedSecteurIdentifiant
    ? trajectoireLeviers?.secteurs.find((secteur) =>
        secteur.identifiants.includes(selectedSecteurIdentifiant)
      )?.nom
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
        titleOptions={{
          left: '1%',
          text: 'Objectifs du territoire à horizon 2030, répartis par leviers',
          textStyle: {
            color: colors.primary['9'],
          },
        }}
        treemapOptions={{
          left: 0,
          right: 0,
          bottom: 20,
        }}
        inputData={trajectoireLeviers}
        selectedSecteur={selectedSecteur}
        selectedLevier={selectedLevier}
        onSelected={(selectedSecteur, selectedLevier) => {
          const sectorIdentifiants = trajectoireLeviers?.secteurs.find(
            (secteur) => secteur.nom === selectedSecteur
          )?.identifiants;
          if (sectorIdentifiants) {
            onSelected?.(sectorIdentifiants, selectedLevier);
          } else {
            onSelected?.(undefined, selectedLevier);
          }

          tracker(Event.indicateurs.trajectoires.secteurLevierClick, {
            collectiviteId: collectiviteId,
            secteur: selectedSecteur,
            levier: selectedLevier,
          });
        }}
        displayErrorModal={(error) => {
          return (
            <ErrorCard title={'Données non disponibles'} subTitle={error} />
          );
        }}
        style={{ height: '700px' }}
      />
    </Card>
  );
};
