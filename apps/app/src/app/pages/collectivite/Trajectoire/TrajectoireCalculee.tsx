import { useCurrentCollectivite } from '@/api/collectivites';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { SgpeMondrian } from '@/app/indicateurs/trajectoire-leviers/sgpe-mondrian';
import { Dataset } from '@/app/ui/charts/echarts/utils';
import HeaderSticky from '@/app/ui/layout/HeaderSticky';
import {
  Button,
  ButtonGroup,
  Card,
  Event,
  Modal,
  Select,
  useEventTracker,
} from '@/ui';
import classNames from 'classnames';
import { AllerPlusLoin } from './AllerPlusLoin';
import { ComparezLaTrajectoire } from './ComparezLaTrajectoire';
import { DonneesCollectivite } from './DonneesCollectivite/DonneesCollectivite';
import { DonneesPartiellementDisponibles } from './DonneesPartiellementDisponibles';
import { Methodologie } from './Methodologie';
import { HELPDESK_URL, INDICATEURS_TRAJECTOIRE } from './constants';
import { GrapheSecteur } from './graphes/GrapheSecteur';
import { GrapheSousSecteurs } from './graphes/GrapheSousSecteurs';
import { GrapheTousSecteurs } from './graphes/GrapheTousSecteurs';
import { useResultatTrajectoire } from './useResultatTrajectoire';

const defaultParams = { indicateurIdx: ['0'], secteurIdx: ['0'] };
const nameToparams: Record<keyof typeof defaultParams, string> = {
  indicateurIdx: 'i',
  secteurIdx: 's',
} as const;

/**
 * Affiche une trajectoire SNBC calculée
 */
export const TrajectoireCalculee = () => {
  const { collectiviteId, isReadOnly, nom } = useCurrentCollectivite();

  // conserve dans l'url les index de l'indicateur trajectoire et du secteur sélectionné
  const [params, setParams] = useSearchParams('', defaultParams, nameToparams);
  const indicateurIdx = parseInt(params.indicateurIdx[0]);
  const secteurIdx = parseInt(params.secteurIdx[0]);

  // indicateur (ges | énergie) sélectionné
  const indicateur = INDICATEURS_TRAJECTOIRE[indicateurIdx];

  // secteur sélectionné
  const secteurs = [
    { nom: 'Tous les secteurs', identifiant: undefined },
    ...(indicateur.secteurs || []),
  ];
  const secteur = secteurIdx === 0 ? null : indicateur.secteurs[secteurIdx - 1];

  // données de la trajectoire
  const {
    identifiant,
    objectifs,
    resultats,
    valeursTousSecteurs,
    valeursSecteur,
    valeursSousSecteurs,
    isLoadingObjectifsResultats,
    donneesSectoriellesIncompletes,
    emissionsNettes,
  } = useResultatTrajectoire({ indicateur, secteurIdx });

  const trackEvent = useEventTracker();

  return (
    collectiviteId && (
      <div className="grow">
        <HeaderSticky
          render={({ isSticky }) => (
            <div
              className={classNames('bg-grey-2 border-b border-primary-3', {
                'pt-2': isSticky,
              })}
            >
              {/** En-tête */}
              <div
                className={classNames(
                  'flex items-start border-b border-grey-3',
                  {
                    'pb-4': !isSticky,
                    'pb-2': isSticky,
                  }
                )}
              >
                <div className="flex-grow">
                  <h2
                    className={classNames('mb-1 leading-tight', {
                      'text-3xl': !isSticky,
                      'text-2xl': isSticky,
                    })}
                  >
                    {`Trajectoire SNBC et objectifs`}
                  </h2>
                  <div className="flex gap-3 items-center">
                    <Modal size="lg" render={(props) => <AllerPlusLoin />}>
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
                {!isReadOnly && (
                  <Modal
                    size="xl"
                    render={(props) => (
                      <DonneesCollectivite modalProps={props} />
                    )}
                  >
                    <Button size="sm">Recalculer la trajectoire</Button>
                  </Modal>
                )}
              </div>

              {/** Sélecteurs */}
              <div
                className={classNames('flex items-center gap-4', {
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
                          return setParams({
                            indicateurIdx: [String(idx)],
                            secteurIdx: ['0'],
                          });
                        },
                      })
                    )}
                  />
                </div>

                {
                  <div className="w-64">
                    <Select
                      values={secteurIdx}
                      dropdownZindex={60} // above sticky header
                      placeholder="Tous les secteurs"
                      options={secteurs.map(({ nom }, optionIdx) => ({
                        value: optionIdx,
                        label: nom,
                      }))}
                      onChange={(val) => {
                        if (val) {
                          trackEvent(Event.trajectoire.selectSecteur, {
                            indicateurId: indicateur.id,
                            secteur:
                              indicateur?.secteurs[val as number]?.identifiant,
                          });
                        }
                        return setParams({
                          ...params,
                          secteurIdx: [String(val)],
                        });
                      }}
                    />
                  </div>
                }
              </div>
            </div>
          )}
        />

        <div className="flex flex-row gap-8">
          <div className="flex flex-col gap-8 w-4/6">
            {
              /** Avertissement "Données partiellement disponibles" */
              !secteur && donneesSectoriellesIncompletes && (
                <DonneesPartiellementDisponibles
                  disabled={isReadOnly}
                  description={
                    isReadOnly
                      ? "Il manque des données pour certains secteurs : un utilisateur en Edition ou Admin sur le profil de cette collectivité peut compléter les données manquantes pour l'année 2015 afin de finaliser le calcul"
                      : undefined
                  }
                />
              )
            }
            {
              /** Graphique "tous secteurs" */
              !secteur && valeursTousSecteurs && (
                <Card className="h-fit">
                  <GrapheTousSecteurs
                    unite={indicateur.unite}
                    titre={indicateur.titre}
                    secteurs={valeursTousSecteurs as Dataset[]}
                    objectifs={objectifs}
                    resultats={resultats}
                    emissionsNettes={emissionsNettes}
                  />
                </Card>
              )
            }
            {
              /** Graphique du secteur sélectionné */
              !!(secteur && valeursSecteur && valeursSecteur.source.length) && (
                <Card className="h-fit">
                  <GrapheSecteur
                    unite={indicateur.unite}
                    titre={`${indicateur.titre}, secteur ${secteur.nom}`}
                    secteur={valeursSecteur}
                    objectifs={objectifs}
                    resultats={resultats}
                  />

                  <Methodologie secteur={secteur} />
                </Card>
              )
            }
            {
              /** Graphique sous-sectoriel */
              !!(
                secteur &&
                valeursSousSecteurs &&
                valeursSousSecteurs.length
              ) && (
                <Card className="h-fit">
                  <GrapheSousSecteurs
                    unite={indicateur.unite}
                    titre={`${indicateur.titreSecteur}, secteur ${secteur.nom}`}
                    sousSecteurs={valeursSousSecteurs as Dataset[]}
                  />
                </Card>
              )
            }
            {
              /** Données non disponibles pour le secteur sélectionné */
              secteur && !valeursSecteur && (
                <DonneesPartiellementDisponibles
                  title="Données non disponibles"
                  description={
                    isReadOnly
                      ? 'Nous ne disposons pas encore des données nécessaires pour calculer la trajectoire SNBC territorialisée de ce secteur. Nous y travaillons activement et espérons vous fournir ces informations très prochainement. En attendant, un utilisateur en Edition ou Admin sur le profil de cette collectivité peut compléter les données déjà disponibles pour calculer la trajectoire pour l’ensemble des secteurs.'
                      : 'Nous ne disposons pas encore des données nécessaires pour calculer la trajectoire SNBC territorialisée de ce secteur. Nous y travaillons activement et espérons vous fournir ces informations très prochainement. En attendant, vous pouvez calculer dès maintenant votre trajectoire pour l’ensemble des secteurs en complétant les données déjà disponibles.'
                  }
                  disabled={isReadOnly}
                />
              )
            }

            {indicateurIdx === 0 && (
              <SgpeMondrian
                selectedSecteurIdentifiant={secteur?.identifiant}
                onSecteurIdentifiantsSelected={(sectorIdentifiants) => {
                  const secteursIdx = sectorIdentifiants?.map(
                    (sectorIdentifiant) => {
                      return secteurs.findIndex(
                        (secteur) => sectorIdentifiant === secteur?.identifiant
                      );
                    }
                  );
                  const firstValidSectorIdx =
                    secteursIdx?.find((sectorIdx) => sectorIdx !== -1) || 0;

                  setParams({
                    ...params,
                    secteurIdx: [String(firstValidSectorIdx)],
                  });
                }}
              />
            )}
          </div>

          {/** Colonne de droite */}
          <div className="w-2/6 flex flex-col gap-8">
            {!isLoadingObjectifsResultats &&
              (objectifs.source.length === 0 ||
                resultats.source.length === 0) && (
                <ComparezLaTrajectoire
                  collectiviteId={collectiviteId}
                  identifiantReferentiel={identifiant}
                  readonly={isReadOnly}
                />
              )}
          </div>
        </div>
      </div>
    )
  );
};
