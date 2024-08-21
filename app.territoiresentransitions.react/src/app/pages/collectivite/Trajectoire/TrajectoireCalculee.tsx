import {useState} from 'react';
import {Button, ButtonGroup, Card, Tabs, Tab} from '@tet/ui';
import {LineData} from 'ui/charts/Line/LineChart';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {HELPDESK_URL, INDICATEURS_TRAJECTOIRE} from './constants';
import {useResultatTrajectoire} from './useResultatTrajectoire';
import {TrajectoireChart} from './TrajectoireChart';
import {TrajectoireSecteurChart} from './TrajectoireSecteurChart';
import {AllerPlusLoin} from './AllerPlusLoin';
import {ComparezLaTrajectoire} from './ComparezLaTrajectoire';
import {Methodologie} from './Methodologie';
import {DonneesPartiellementDisponibles} from './DonneesPartiellementDisponibles';

/**
 * Affiche une trajectoire SNBC calculée
 */
export const TrajectoireCalculee = () => {
  const collectiviteId = useCollectiviteId()!;

  // indicateur (ges | énergie) sélectionné
  const [indicateurIdx, setIndicateurIdx] = useState<number>(0);
  const indicateur = INDICATEURS_TRAJECTOIRE[indicateurIdx];

  // secteur sélectionné
  const secteurs = [{nom: 'Tous les secteurs'}, ...(indicateur.secteurs || [])];
  const [secteurIdx, setSecteurIdx] = useState<number>(0);
  const secteur = secteurIdx === 0 ? null : indicateur.secteurs[secteurIdx - 1];

  // données de la trajectoire
  const {
    identifiant,
    objectifs,
    resultats,
    valeursTousSecteurs,
    valeursSecteur,
    isLoadingObjectifsResultats,
    donneesSectoriellesIncompletes,
  } = useResultatTrajectoire({indicateur, secteurIdx, coef: indicateur.coef});

  return (
    <div className="grow py-12">
      {/** En-tête */}
      <div className="flex items-start mb-4">
        <div className="flex-grow">
          <h2 className="mb-1">Trajectoire SNBC territorialisée</h2>
          <Button size="sm" variant="underlined" external href={HELPDESK_URL}>
            En savoir plus
          </Button>
        </div>
        <Button size="sm">Calculer une nouvelle trajectoire</Button>
      </div>

      <hr />

      {/** Sélecteurs */}
      <div className="flex items-start justify-between">
        {
          /** Sélecteur de secteur */
          !!indicateur?.secteurs && (
            <Tabs
              defaultActiveTab={secteurIdx}
              onChange={setSecteurIdx}
              size="sm"
            >
              {secteurs.map(({nom}) => (
                <Tab key={nom} label={nom} />
              ))}
            </Tabs>
          )
        }
        {/** Sélecteur de trajectoire */}
        <ButtonGroup
          size="sm"
          activeButtonId={indicateur.id}
          buttons={INDICATEURS_TRAJECTOIRE.map(({id, nom}, idx) => ({
            id,
            children: nom,
            onClick: () => {
              setIndicateurIdx(idx);
              setSecteurIdx(0);
            },
          }))}
        />
      </div>

      <div className="flex flex-row gap-8">
        <div className="flex flex-col gap-8 w-4/6">
          {
            /** Graphique "tous secteurs" */
            !secteur && valeursTousSecteurs && (
              <Card className="h-fit">
                <TrajectoireChart
                  unite={indicateur.unite}
                  titre={indicateur.titre}
                  secteurs={valeursTousSecteurs as LineData[]}
                  objectifs={{id: 'objectifs', data: objectifs}}
                  resultats={{id: 'resultats', data: resultats}}
                />
              </Card>
            )
          }
          {
            /** Graphique du secteur sélectionné */
            secteur && valeursSecteur && (
              <Card className="h-fit">
                <TrajectoireSecteurChart
                  unite={indicateur.unite}
                  titre={`${indicateur.titre}, secteur ${secteur.nom}`}
                  secteur={valeursSecteur.data}
                  objectifs={objectifs}
                  resultats={resultats}
                ></TrajectoireSecteurChart>
              </Card>
            )
          }
          {
            /** Avertissement "Données partiellement disponibles" */
            secteurIdx === 0 && donneesSectoriellesIncompletes && (
              <DonneesPartiellementDisponibles
                collectiviteId={collectiviteId}
                identifiantReferentiel={identifiant}
              />
            )
          }
        </div>

        {/** Colonne de droite */}
        <div className="w-2/6 flex flex-col gap-8">
          {!isLoadingObjectifsResultats &&
            (objectifs.length === 0 || resultats.length === 0) && (
              <ComparezLaTrajectoire
                collectiviteId={collectiviteId}
                identifiantReferentiel={identifiant}
              />
            )}
          {secteurIdx !== 0 && secteur && 'snbc2' in secteur && (
            <Methodologie secteur={secteur} />
          )}
          <AllerPlusLoin />
        </div>
      </div>
    </div>
  );
};
