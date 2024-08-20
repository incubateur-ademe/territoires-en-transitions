import {useState} from 'react';
import {Button, ButtonGroup, Card, Tabs, Tab} from '@tet/ui';
import {LineData} from 'ui/charts/Line/LineChart';
import {makeCollectiviteIndicateursUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {HELPDESK_URL, INDICATEURS_TRAJECTOIRE} from './constants';
import {useResultatTrajectoire} from './useResultatTrajectoire';
import {TrajectoireChart} from './TrajectoireChart';
import {AllerPlusLoin} from './AllerPlusLoin';

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

  // données de la trajectoire
  const {
    identifiant,
    objectifs,
    resultats,
    valeursTousSecteurs,
    isLoadingObjectifsResultats,
    //    isLoadingTrajectoire,
  } = useResultatTrajectoire({indicateur, secteurIdx});

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
          <AllerPlusLoin />
        </div>
      </div>
    </div>
  );
};

export default TrajectoireCalculee;
