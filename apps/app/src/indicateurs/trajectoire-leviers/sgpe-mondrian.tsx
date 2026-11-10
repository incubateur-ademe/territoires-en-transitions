import { useTrajectoireLeviers } from '@/app/indicateurs/trajectoire-leviers/use-trajectoire-leviers';
import { TOOLBOX_BASE } from '@/app/ui/charts/echarts';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { Card, Event, preset, useEventTracker } from '@tet/ui';
import { MondrianTreemap } from 'mondrian-treemap';
import React from 'react';
import { appLabels } from '@/app/labels/catalog';
import { getSecteursNonRepresentes } from './secteurs-non-representes.utils';

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

  // Les DROM n'ont pas de pourcentages SGPE (chemin SNBC 3, lot 2) : on masque
  // le mondrian plutôt que d'afficher la carte d'erreur générique.
  if (error?.data?.errorKey === 'REGION_NON_SUPPORTEE') {
    return null;
  }

  if (!trajectoireLeviers) {
    return (
      <Card>
        <div className="h-96 flex flex-col">
          <h3 className="text-base mb-0">
            {appLabels.objectifsTerritoireParLevier}
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

  const secteursNonRepresentes = getSecteursNonRepresentes(
    trajectoireLeviers.secteurs
  );

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
      {secteursNonRepresentes.length > 0 && (
        <p
          className="mb-0 text-sm text-grey-7"
          data-test="indicateurs.trajectoires.leviers.secteurs-non-representes"
        >
          {appLabels.trajectoireLeviersSecteursNonRepresentes({
            secteurs: secteursNonRepresentes.join(', '),
          })}
        </p>
      )}
    </Card>
  );
};
