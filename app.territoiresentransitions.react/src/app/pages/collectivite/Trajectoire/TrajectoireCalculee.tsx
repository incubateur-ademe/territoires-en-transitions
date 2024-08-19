import {useState} from 'react';
import {Button, ButtonGroup, Card, Tabs, Tab} from '@tet/ui';
import {LineData} from 'ui/charts/Line/LineChart';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import {makeCollectiviteIndicateursUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIndicateurReferentielValeurs} from 'app/pages/collectivite/Indicateurs/useIndicateurValeurs';
import {HELPDESK_URL, INDICATEURS_TRAJECTOIRE} from './constants';
import {useResultatTrajectoire} from './useResultatTrajectoire';
import {useTelechargementTrajectoire} from './useTelechargementTrajectoire';
import {TrajectoireChart} from './TrajectoireChart';
import {useDownloadFile} from 'utils/useDownloadFile';

// fichier dans le dossier `public`
const METHODO = 'ADEME-Methodo-Outil-trajectoire-référence.pdf';

/**
 * Affiche une trajectoire SNBC calculée
 */
const TrajectoireCalculee = () => {
  const collectiviteId = useCollectiviteId()!;

  // indicateur (ges | énergie) sélectionné
  const [indicateurIdx, setIndicateurIdx] = useState<number>(0);
  const indicateur = INDICATEURS_TRAJECTOIRE[indicateurIdx];

  // secteur séléctionné
  const secteurs = [{nom: 'Tous les secteurs'}, ...(indicateur.secteurs || [])];
  const [secteurIdx, setSecteurIdx] = useState<number>(0);

  // pour télécharger les fichiers
  const {mutate: download, isLoading: isDownloading} =
    useTelechargementTrajectoire();
  const {mutate: downloadFile, isLoading: isDownloadingFile} =
    useDownloadFile();

  // données de la trajectoire
  const {data} = useResultatTrajectoire();
  const trajectoire = data && data.trajectoire?.[indicateur.id];

  // données objectifs/résultats
  const identifiant =
    secteurIdx === 0
      ? indicateur.identifiant
      : indicateur.secteurs[secteurIdx - 1].identifiant;
  const {data: objectifsEtResults, isLoading: isLoadingObjectifsResultats} =
    useIndicateurReferentielValeurs({
      identifiant,
    });
  const objectifs =
    objectifsEtResults
      ?.filter(v => typeof v.objectif === 'number')
      .map(v => ({x: v.annee, y: v.objectif})) || [];
  const resultats =
    objectifsEtResults
      ?.filter(v => typeof v.resultat === 'number')
      .map(v => ({x: v.annee, y: v.resultat})) || [];

  const valeursTousSecteurs =
    trajectoire &&
    indicateur.secteurs
      .map(s => {
        const valeurs = trajectoire.find(
          t => t.definition.identifiant_referentiel === s.identifiant
        )?.valeurs;
        return valeurs
          ? {
              id: s.nom,
              data: valeurs.map(v => ({
                x: new Date(v.date_valeur).getFullYear(),
                y: v.objectif,
              })),
            }
          : null;
      })
      .filter(v => !!v);

  return (
    <div className="grow py-12">
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
      <div className="flex items-start justify-between">
        {!!indicateur?.secteurs && (
          <Tabs
            defaultActiveTab={secteurIdx}
            onChange={setSecteurIdx}
            size="sm"
          >
            {secteurs.map(({nom}) => (
              <Tab key={nom} label={nom} />
            ))}
          </Tabs>
        )}
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
        {valeursTousSecteurs && (
          <Card className="w-4/6 h-fit">
            <TrajectoireChart
              unite={indicateur.unite}
              titre={indicateur.titre}
              secteurs={valeursTousSecteurs as LineData[]}
              objectifs={{id: 'objectifs', data: objectifs}}
              resultats={{id: 'resultats', data: resultats}}
            />
          </Card>
        )}

        <div className="w-2/6 flex flex-col gap-8">
          {!isLoadingObjectifsResultats &&
            (objectifs.length === 0 || resultats.length === 0) && (
              <Card>
                <h5>
                  Comparez la trajectoire SNBC à vos objectifs et vos résultats
                </h5>
                <p className="text-sm font-normal">
                  Vos résultats et vos objectifs ne sont pas disponibles pour
                  cet indicateur. Veuillez les renseigner afin de pouvoir les
                  comparer à votre trajectoire SNBC territorialisée. Vous
                  pourrez ainsi visualiser les écarts plus facilement pour
                  piloter votre stratégie.
                </p>
                <Button
                  href={makeCollectiviteIndicateursUrl({
                    collectiviteId,
                    indicateurView: 'cae',
                    identifiantReferentiel: identifiant,
                  })}
                  variant="outlined"
                >
                  Compléter mes indicateurs
                </Button>
              </Card>
            )}
          <Card>
            <h5>Aller plus loin</h5>
            <p className="text-sm font-normal mb-2">
              Téléchargez le fichier Excel de calcul pour comprendre le détail
              des calculs et approfondir votre analyse.
            </p>
            <Button
              variant="outlined"
              onClick={() => download()}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  Téléchargement en cours <SpinnerLoader />
                </>
              ) : (
                'Télécharger les données (.xlsx)'
              )}
            </Button>
            <p className="text-sm font-normal mt-2 mb-2">
              Télécharger les fichiers de l’étude détaillant la méthodologie,
              etc.
            </p>
            <Button
              variant="outlined"
              onClick={() => downloadFile(METHODO)}
              disabled={isDownloadingFile}
            >
              Télécharger la méthodologie (.pdf)
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrajectoireCalculee;
