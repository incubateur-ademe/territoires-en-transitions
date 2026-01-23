import { useDonneesSectorisees } from '@/app/app/pages/collectivite/Trajectoire/DonneesCollectivite/useDonneesSectorisees';
import { Methodologie } from '@/app/app/pages/collectivite/Trajectoire/Methodologie';
import { GrapheSecteur } from '@/app/app/pages/collectivite/Trajectoire/graphes/GrapheSecteur';
import { GrapheTousSecteurs } from '@/app/app/pages/collectivite/Trajectoire/graphes/GrapheTousSecteurs';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from '@/app/app/paths';
import { SgpeMondrian } from '@/app/indicateurs/trajectoire-leviers/sgpe-mondrian';
import { Dataset } from '@/app/ui/charts/echarts/utils';
import HeaderSticky, {
  Z_INDEX_ABOVE_STICKY_HEADER,
} from '@/app/ui/layout/HeaderSticky';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  Button,
  ButtonGroup,
  Card,
  Event,
  Modal,
  Select,
  Spacer,
  useEventTracker,
  VisibleWhen,
} from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { isNil } from 'es-toolkit';
import { parseAsInteger, parseAsStringEnum, useQueryStates } from 'nuqs';
import { useState } from 'react';
import {
  HELPDESK_URL,
  INDICATEURS_TRAJECTOIRE,
  INDICATEURS_TRAJECTOIRE_IDS,
  IndicateurTrajectoireId,
} from '../../../../indicateurs/trajectoires/trajectoire-constants';
import { AllerPlusLoin } from './AllerPlusLoin';
import { ComparezLaTrajectoire } from './ComparezLaTrajectoire';
import { DonneesCollectivite } from './DonneesCollectivite/DonneesCollectivite';
import { DonneesPartiellementDisponibles } from './DonneesPartiellementDisponibles';
import { useIndicateurTrajectoire } from './use-indicateur-trajectoire';

type Params = {
  indicateurId: IndicateurTrajectoireId;
  secteurIdx: 0;
};
const defaultParams: Params = {
  indicateurId: 'emissions_ges',
  secteurIdx: 0,
};
const nameToParams: Record<keyof Params, string> = {
  indicateurId: 'i',
  secteurIdx: 's',
} as const;

/**
 * Affiche une trajectoire SNBC calculée
 */
export const TrajectoireCalculee = () => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  // State pour contrôler l'ouverture de la modale de recalcul
  const [isModalDataOpen, setIsModalDataOpen] = useState(false);

  // conserve dans l'url les index de l'indicateur trajectoire et du secteur sélectionné
  const [params, setParams] = useQueryStates(
    {
      indicateurId: parseAsStringEnum<IndicateurTrajectoireId>([
        ...INDICATEURS_TRAJECTOIRE_IDS,
      ]).withDefault(defaultParams.indicateurId),
      secteurIdx: parseAsInteger.withDefault(defaultParams.secteurIdx),
    },
    {
      urlKeys: nameToParams,
    }
  );
  const indicateurId = params.indicateurId;
  const selectedSecteurIdx = params.secteurIdx;

  // indicateur (ges | énergie) sélectionné
  const indicateur = INDICATEURS_TRAJECTOIRE[indicateurId];

  // secteur sélectionné
  const secteurs = [
    { nom: 'Tous les secteurs', identifiant: undefined },
    ...(indicateur.secteurs || []),
  ];
  const selectedSecteur =
    selectedSecteurIdx === 0
      ? null
      : indicateur.secteurs[selectedSecteurIdx - 1];

  // données de la trajectoire
  const {
    identifiant,
    objectifs,
    resultats,
    valeursTousSecteurs,
    valeursSecteur,
    valeursSousSecteurs,
    isLoadingObjectifsResultats,
    isLoadingTrajectoire,
    emissionsNettes,
  } = useIndicateurTrajectoire({ indicateur, secteurIdx: selectedSecteurIdx });

  const { donneesSectorisees, isLoading: isLoadingDonneesSectorisees } =
    useDonneesSectorisees();
  const isDataExhaustiveEnoughToCompute = Object.values(
    donneesSectorisees
  ).every((d) => d.dataCompletionStatus.isDataSufficient);

  const trackEvent = useEventTracker();

  const shouldShowDataPartiallyFilledWarning = Boolean(
    !selectedSecteur && !isDataExhaustiveEnoughToCompute
  );

  const isLoadingTrajectoireIndicateurData =
    isLoadingTrajectoire || isLoadingObjectifsResultats;
  const allSecteursDataAvailable = !selectedSecteur && valeursTousSecteurs;

  const selectedSecteurDataNotAvailable = Boolean(
    selectedSecteur && !valeursSecteur
  );

  const selectedSecteurDataAvailable =
    selectedSecteur && valeursSecteur && valeursSecteur.source.length;

  const canMutateValeurs = hasCollectivitePermission(
    'indicateurs.valeurs.mutate'
  );

  const recomputeButtonIsVisible =
    canMutateValeurs &&
    !shouldShowDataPartiallyFilledWarning &&
    !selectedSecteurDataNotAvailable;

  const comparezLaTrajectoireIsVisible =
    !isLoadingObjectifsResultats &&
    (objectifs.source.length === 0 || resultats.source.length === 0);

  if (!collectiviteId) {
    return null;
  }

  const DISPLAYABLE_INDICATEURS_TRAJECTOIRE: IndicateurTrajectoireId[] = [
    'emissions_ges',
    'consommations_finales',
  ];

  return (
    <div className="grow">
      <HeaderSticky
        render={({ isSticky }) => (
          <div
            className={cn('bg-grey-2 border-primary-3', {
              'pt-2': isSticky,
              'border-b': isSticky,
            })}
          >
            {/** En-tête */}
            <div
              className={cn('flex items-start border-b border-grey-3', {
                'pb-4': !isSticky,
                'pb-2': isSticky,
              })}
            >
              <div className="flex-grow">
                <h2
                  className={cn('mb-1 leading-tight', {
                    'text-3xl': !isSticky,
                    'text-2xl': isSticky,
                  })}
                >
                  Trajectoire SNBC et objectifs
                </h2>
                <div className="flex gap-3 items-center">
                  <Modal size="lg" render={() => <AllerPlusLoin />}>
                    <Button size="sm" variant="underlined">
                      Aller plus loin
                    </Button>
                  </Modal>
                  <div className="w-[0.5px] h-8 bg-primary-7" />
                  <Button
                    size="sm"
                    variant="underlined"
                    external
                    href={HELPDESK_URL}
                  >
                    En savoir plus
                  </Button>
                </div>
              </div>
              <VisibleWhen condition={recomputeButtonIsVisible}>
                <Button size="sm" onClick={() => setIsModalDataOpen(true)}>
                  Recalculer la trajectoire
                </Button>
              </VisibleWhen>
            </div>

            {/** Sélecteurs */}
            <div
              className={cn('flex items-center gap-4', {
                'py-5': !isSticky,
                'py-3': isSticky,
              })}
            >
              {/** Sélecteur de trajectoire */}
              <div>
                <ButtonGroup
                  size="sm"
                  activeButtonId={indicateur.id}
                  buttons={DISPLAYABLE_INDICATEURS_TRAJECTOIRE.map(
                    (indicateurId) => {
                      const { nom, secteurs } =
                        INDICATEURS_TRAJECTOIRE[indicateurId];
                      return {
                        id: indicateurId,
                        children: nom,
                        onClick: () => {
                          trackEvent(Event.trajectoire.selectIndicateur, {
                            indicateurId,
                          });
                          // On essaye de garder le même secteur si il existe pour le nouvel indicateur
                          const currentSecteurName = selectedSecteurIdx
                            ? indicateur.secteurs[selectedSecteurIdx - 1].nom
                            : null;
                          const foundSecteurInNewIndicateur = currentSecteurName
                            ? secteurs.findIndex(
                                (secteur) => secteur.nom === currentSecteurName
                              )
                            : null;

                          return setParams({
                            indicateurId,
                            secteurIdx:
                              foundSecteurInNewIndicateur &&
                              foundSecteurInNewIndicateur >= 0
                                ? foundSecteurInNewIndicateur + 1
                                : 0,
                          });
                        },
                      };
                    }
                  )}
                />
              </div>

              <div className="w-64">
                <Select
                  values={selectedSecteurIdx}
                  dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER} // above sticky header
                  placeholder="Tous les secteurs"
                  options={secteurs.map(({ nom }, optionIdx) => ({
                    value: optionIdx,
                    label: nom,
                  }))}
                  onChange={(val) => {
                    const sectorIdx = !isNil(val)
                      ? typeof val === 'number'
                        ? val
                        : parseInt(String(val))
                      : 0;
                    if (sectorIdx > 0) {
                      trackEvent(Event.trajectoire.selectSecteur, {
                        indicateurId: indicateur.id,
                        secteur:
                          indicateur?.secteurs[sectorIdx - 1]?.identifiant,
                      });
                    }
                    return setParams({
                      secteurIdx: sectorIdx,
                    });
                  }}
                />
              </div>
            </div>
          </div>
        )}
      />

      <div className="flex flex-col gap-8 w-full">
        <VisibleWhen
          condition={
            shouldShowDataPartiallyFilledWarning &&
            isLoadingDonneesSectorisees === false
          }
        >
          <DonneesPartiellementDisponibles
            disabled={!canMutateValeurs}
            description={
              !canMutateValeurs
                ? "Il manque des données pour certains secteurs : un utilisateur en Edition ou Admin sur le profil de cette collectivité peut compléter les données manquantes pour l'année 2015 afin de finaliser le calcul"
                : undefined
            }
            onOpenModal={() => setIsModalDataOpen(true)}
          />
        </VisibleWhen>

        <VisibleWhen condition={comparezLaTrajectoireIsVisible}>
          <ComparezLaTrajectoire
            collectiviteId={collectiviteId}
            identifiantReferentiel={identifiant}
            readonly={!canMutateValeurs}
          />
        </VisibleWhen>

        {allSecteursDataAvailable && (
          <Card className="h-fit">
            <GrapheTousSecteurs
              unite={indicateur.unite}
              titre={indicateur.titre}
              secteurs={valeursTousSecteurs}
              objectifs={objectifs}
              resultats={resultats}
              emissionsNettes={emissionsNettes}
            />
          </Card>
        )}

        {selectedSecteurDataAvailable && (
          <Card className="h-fit">
            <GrapheSecteur
              unite={indicateur.unite}
              titre={`${indicateur.titre}, secteur ${selectedSecteur.nom}`}
              secteur={valeursSecteur}
              sousSecteurs={valeursSousSecteurs || null}
              objectifs={objectifs}
              resultats={resultats}
            />
            <Spacer height={0.5} />
            <LinksToIndicateurs
              indicateurData={[valeursSecteur, ...(valeursSousSecteurs || [])]}
              collectiviteId={collectiviteId}
              indicateurView="cae"
            />
            <Methodologie secteur={selectedSecteur} />
          </Card>
        )}

        <VisibleWhen condition={isLoadingTrajectoireIndicateurData}>
          <Card className="h-[450px]">
            <div className="flex flex-col h-full">
              <h3 className="text-base mb-0">{indicateur.titre}</h3>
              <SpinnerLoader className="m-auto" />
            </div>
          </Card>
        </VisibleWhen>

        <VisibleWhen condition={selectedSecteurDataNotAvailable}>
          <DonneesPartiellementDisponibles
            title="Données non disponibles"
            description={
              canMutateValeurs
                ? `Nous ne disposons pas encore des données nécessaires pour calculer la trajectoire SNBC territorialisée de ce secteur. Nous y travaillons activement et espérons vous fournir ces informations très prochainement. En attendant, vous pouvez calculer dès maintenant votre trajectoire pour l'ensemble des secteurs en complétant les données déjà disponibles.`
                : `Nous ne disposons pas encore des données nécessaires pour calculer la trajectoire SNBC territorialisée de ce secteur. Nous y travaillons activement et espérons vous fournir ces informations très prochainement. En attendant, un utilisateur en Edition ou Admin sur le profil de cette collectivité peut compléter les données déjà disponibles pour calculer la trajectoire pour l'ensemble des secteurs.`
            }
            disabled={!canMutateValeurs}
            onOpenModal={() => setIsModalDataOpen(true)}
          />
        </VisibleWhen>

        <VisibleWhen condition={indicateurId === 'emissions_ges'}>
          <SgpeMondrian
            selectedSecteurIdentifiant={selectedSecteur?.identifiant}
            onSelected={(secteurIdentifiants) => {
              const secteursIdx = secteurIdentifiants?.map(
                (secteurIdentifiant) => {
                  return secteurs.findIndex(
                    (secteur) => secteurIdentifiant === secteur?.identifiant
                  );
                }
              );
              const firstValidSectorIdx =
                secteursIdx?.find((sectorIdx) => sectorIdx !== -1) || 0;

              setParams({
                secteurIdx: firstValidSectorIdx,
              });
            }}
          />
        </VisibleWhen>
      </div>

      <Modal
        size="xl"
        openState={{
          isOpen: isModalDataOpen,
          setIsOpen: setIsModalDataOpen,
        }}
        render={(props) => <DonneesCollectivite modalProps={props} />}
      />
    </div>
  );
};

type IndicateurWithId = Dataset & {
  id: string;
  name: string;
};

const LinksToIndicateurs = ({
  indicateurData,
  collectiviteId,
  indicateurView,
}: {
  indicateurData: IndicateurWithId | IndicateurWithId[];
  collectiviteId: number;
  indicateurView: IndicateurViewParamOption | undefined;
  className?: string;
}) => {
  const hasSingleIndicateur = !Array.isArray(indicateurData);

  if (hasSingleIndicateur) {
    return (
      <Button
        size="sm"
        variant="underlined"
        external
        href={makeCollectiviteIndicateursUrl({
          collectiviteId,
          indicateurView,
          identifiantReferentiel: indicateurData.id,
        })}
        aria-label={`Consulter la fiche de l'indicateur ${indicateurData.name}`}
      >
        Voir la fiche de l&apos;indicateur
      </Button>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <div className="text-primary-8 text-xs font-medium mb-1">
        Voir les fiches des indicateurs&nbsp;:
      </div>
      <ul role="list" className="flex gap-4 items-end mb-0">
        {indicateurData.map((indicateur) => (
          <li key={indicateur.id}>
            <Button
              size="xs"
              variant="underlined"
              external
              href={makeCollectiviteIndicateursUrl({
                collectiviteId,
                indicateurView,
                identifiantReferentiel: indicateur.id,
              })}
              title={indicateur.name}
              aria-label={`Consulter la fiche de l'indicateur ${indicateur.name}`}
            >
              {indicateur.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
