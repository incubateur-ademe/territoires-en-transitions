import { useSearchParams } from '@/app/core-logic/hooks/query';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import {
  Button,
  ButtonGroup,
  Card,
  Modal,
  Tab,
  Tabs,
  useEventTracker,
  useOngletTracker,
} from '@/ui';
import { AllerPlusLoin } from './AllerPlusLoin';
import { ComparezLaTrajectoire } from './ComparezLaTrajectoire';
import { HELPDESK_URL, INDICATEURS_TRAJECTOIRE } from './constants';
import { DonneesCollectivite } from './DonneesCollectivite/DonneesCollectivite';
import { DonneesPartiellementDisponibles } from './DonneesPartiellementDisponibles';
import { GrapheSecteur } from './graphes/GrapheSecteur';
import { GrapheSousSecteurs } from './graphes/GrapheSousSecteurs';
import { GrapheTousSecteurs } from './graphes/GrapheTousSecteurs';
import { Dataset } from './graphes/utils';
import { Methodologie } from './Methodologie';
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
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectivite_id;

  // conserve dans l'url les index de l'indicateur trajectoire et du secteur sélectionné
  const [params, setParams] = useSearchParams('', defaultParams, nameToparams);
  const indicateurIdx = parseInt(params.indicateurIdx[0]);
  const secteurIdx = parseInt(params.secteurIdx[0]);

  // indicateur (ges | énergie) sélectionné
  const indicateur = INDICATEURS_TRAJECTOIRE[indicateurIdx];

  // secteur sélectionné
  const secteurs = [
    { nom: 'Tous les secteurs' },
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

  const trackTab = useOngletTracker('app/trajectoires/snbc');
  const trackEvent = useEventTracker('app/trajectoires/snbc', indicateur.id);

  return (
    collectiviteId && (
      <div className="grow py-12">
        {/** En-tête */}
        <div className="flex items-start mb-4">
          <div className="flex-grow">
            <h2 className="mb-1">Trajectoire SNBC territorialisée</h2>
            <Button size="sm" variant="underlined" external href={HELPDESK_URL}>
              En savoir plus
            </Button>
          </div>
          {!collectivite.readonly && (
            <Modal
              size="xl"
              render={(props) => <DonneesCollectivite modalProps={props} />}
            >
              <Button size="sm">Recalculer la trajectoire</Button>
            </Modal>
          )}
        </div>

        <hr />

        {/** Sélecteurs */}
        <div className="flex items-start justify-between">
          {/** Sélecteur de trajectoire */}
          <ButtonGroup
            size="sm"
            activeButtonId={indicateur.id}
            buttons={INDICATEURS_TRAJECTOIRE.map(({ id, nom }, idx) => ({
              id,
              children: nom,
              onClick: () => {
                trackTab(id, { collectivite_id: collectiviteId });
                return setParams({
                  indicateurIdx: [String(idx)],
                  secteurIdx: ['0'],
                });
              },
            }))}
          />
          {
            /** Sélecteur de secteur */
            !!indicateur?.secteurs && (
              <Tabs
                defaultActiveTab={secteurIdx}
                onChange={(idx) => {
                  trackEvent('selection_secteur', {
                    collectivite_id: collectiviteId,
                    secteur: indicateur?.secteurs[idx]?.identifiant,
                  });
                  return setParams({ ...params, secteurIdx: [String(idx)] });
                }}
                size="sm"
              >
                {secteurs.map(({ nom }) => (
                  <Tab key={nom} label={nom} />
                ))}
              </Tabs>
            )
          }
        </div>

        <div className="flex flex-row gap-8">
          <div className="flex flex-col gap-8 w-4/6">
            {
              /** Avertissement "Données partiellement disponibles" */
              !secteur && donneesSectoriellesIncompletes && (
                <DonneesPartiellementDisponibles />
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
                  description="Nous ne disposons pas encore des données nécessaires pour calculer la trajectoire SNBC territorialisée de ce secteur. Nous y travaillons activement et espérons vous fournir ces informations très prochainement. En attendant, vous pouvez calculer dès maintenant votre trajectoire pour l’ensemble des secteurs en complétant les données déjà disponibles."
                />
              )
            }
          </div>

          {/** Colonne de droite */}
          <div className="w-2/6 flex flex-col gap-8">
            {!isLoadingObjectifsResultats &&
              (objectifs.source.length === 0 ||
                resultats.source.length === 0) && (
                <ComparezLaTrajectoire
                  collectiviteId={collectiviteId}
                  identifiantReferentiel={identifiant}
                />
              )}
            {secteur && <Methodologie secteur={secteur} />}
            <AllerPlusLoin />
          </div>
        </div>
      </div>
    )
  );
};
