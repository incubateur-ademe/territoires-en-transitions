import { useCurrentCollectivite } from '@/api/collectivites';
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
} from '@/ui';
import { cn } from '@/ui/utils/cn';
import { isNil } from 'es-toolkit/predicate';
import { parseAsInteger, useQueryStates } from 'nuqs';
import {
  HELPDESK_URL,
  INDICATEURS_TRAJECTOIRE,
} from '../../../../indicateurs/trajectoires/trajectoire-constants';
import { AllerPlusLoin } from './AllerPlusLoin';
import { ComparezLaTrajectoire } from './ComparezLaTrajectoire';
import { DonneesCollectivite } from './DonneesCollectivite/DonneesCollectivite';
import { DonneesPartiellementDisponibles } from './DonneesPartiellementDisponibles';
import { useIndicateurTrajectoire } from './use-indicateur-trajectoire';

const defaultParams = { indicateurIdx: 0, secteurIdx: 0 };
const nameToparams: Record<keyof typeof defaultParams, string> = {
  indicateurIdx: 'i',
  secteurIdx: 's',
} as const;

/**
 * Affiche une trajectoire SNBC calculée
 */
export const TrajectoireCalculee = () => {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();

  // conserve dans l'url les index de l'indicateur trajectoire et du secteur sélectionné
  const [params, setParams] = useQueryStates(
    {
      indicateurIdx: parseAsInteger.withDefault(defaultParams.indicateurIdx),
      secteurIdx: parseAsInteger.withDefault(defaultParams.secteurIdx),
    },
    {
      urlKeys: nameToparams,
    }
  );
  const indicateurIdx = params.indicateurIdx;
  const selectedSecteurIdx = params.secteurIdx;

  // indicateur (ges | énergie) sélectionné
  const indicateur = INDICATEURS_TRAJECTOIRE[indicateurIdx];

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
    donneesSectoriellesIncompletes,
    emissionsNettes,
  } = useIndicateurTrajectoire({ indicateur, secteurIdx: selectedSecteurIdx });

  const trackEvent = useEventTracker();

  const allSecteursDataNotComplete = Boolean(
    !selectedSecteur && donneesSectoriellesIncompletes
  );

  const isLoadingTrajectoireIndicateurData =
    isLoadingTrajectoire || isLoadingObjectifsResultats;
  const allSecteursDataAvailable = !selectedSecteur && valeursTousSecteurs;

  const selectedSecteurDataNotAvailable = Boolean(
    selectedSecteur && !valeursSecteur
  );

  const selectedSecteurDataAvailable =
    selectedSecteur && valeursSecteur && valeursSecteur.source.length;

  const recomputeButtonIsVisible = !(
    isReadOnly ||
    allSecteursDataNotComplete ||
    selectedSecteurDataNotAvailable
  );

  const comparezLaTrajectoireIsVisible =
    !isLoadingObjectifsResultats &&
    (objectifs.source.length === 0 || resultats.source.length === 0);

  return (
    collectiviteId && (
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
                    {`Trajectoire SNBC et objectifs`}
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
                  <Modal
                    size="xl"
                    render={(props) => (
                      <DonneesCollectivite modalProps={props} />
                    )}
                  >
                    <Button size="sm">Recalculer la trajectoire</Button>
                  </Modal>
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
                    buttons={INDICATEURS_TRAJECTOIRE.map(
                      ({ id, nom }, idx) => ({
                        id,
                        children: nom,
                        onClick: () => {
                          trackEvent(Event.trajectoire.selectIndicateur, {
                            indicateurId: id,
                          });
                          // On essaye de garder le même secteur si il existe pour le nouvel indicateur
                          const currentSecteurName = selectedSecteurIdx
                            ? indicateur.secteurs[selectedSecteurIdx - 1].nom
                            : null;
                          const foundSecteurInNewIndicateur = currentSecteurName
                            ? INDICATEURS_TRAJECTOIRE[idx].secteurs.findIndex(
                                (secteur) => secteur.nom === currentSecteurName
                              )
                            : null;

                          return setParams({
                            indicateurIdx: idx,
                            secteurIdx:
                              foundSecteurInNewIndicateur &&
                              foundSecteurInNewIndicateur >= 0
                                ? foundSecteurInNewIndicateur + 1
                                : 0,
                          });
                        },
                      })
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
          <VisibleWhen condition={allSecteursDataNotComplete}>
            <DonneesPartiellementDisponibles
              disabled={isReadOnly}
              description={
                isReadOnly
                  ? "Il manque des données pour certains secteurs : un utilisateur en Edition ou Admin sur le profil de cette collectivité peut compléter les données manquantes pour l'année 2015 afin de finaliser le calcul"
                  : undefined
              }
            />
          </VisibleWhen>

          <VisibleWhen condition={comparezLaTrajectoireIsVisible}>
            <ComparezLaTrajectoire
              collectiviteId={collectiviteId}
              identifiantReferentiel={identifiant}
              readonly={isReadOnly}
            />
          </VisibleWhen>

          <VisibleWhen condition={isLoadingTrajectoireIndicateurData}>
            <Card className="h-[450px]">
              <div className="flex flex-col h-full">
                <h3 className="text-base mb-0">{indicateur.titre}</h3>
                <SpinnerLoader containerClassName="flex items-center justify-center grow" />
              </div>
            </Card>
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
                indicateurData={[
                  valeursSecteur,
                  ...(valeursSousSecteurs || []),
                ]}
                collectiviteId={collectiviteId}
                indicateurView="cae"
              />
              <Methodologie secteur={selectedSecteur} />
            </Card>
          )}

          <VisibleWhen condition={selectedSecteurDataNotAvailable}>
            <DonneesPartiellementDisponibles
              title="Données non disponibles"
              description={
                isReadOnly
                  ? 'Nous ne disposons pas encore des données nécessaires pour calculer la trajectoire SNBC territorialisée de ce secteur. Nous y travaillons activement et espérons vous fournir ces informations très prochainement. En attendant, un utilisateur en Edition ou Admin sur le profil de cette collectivité peut compléter les données déjà disponibles pour calculer la trajectoire pour l’ensemble des secteurs.'
                  : 'Nous ne disposons pas encore des données nécessaires pour calculer la trajectoire SNBC territorialisée de ce secteur. Nous y travaillons activement et espérons vous fournir ces informations très prochainement. En attendant, vous pouvez calculer dès maintenant votre trajectoire pour l’ensemble des secteurs en complétant les données déjà disponibles.'
              }
              disabled={isReadOnly}
            />
          </VisibleWhen>

          <VisibleWhen condition={indicateurIdx === 0}>
            <SgpeMondrian
              selectedSecteurIdentifiant={selectedSecteur?.identifiant}
              onSelected={(secteurIdentifiants, levier) => {
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
      </div>
    )
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
