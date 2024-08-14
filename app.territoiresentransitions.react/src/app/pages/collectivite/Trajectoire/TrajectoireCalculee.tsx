import {useState} from 'react';
import {Button, ButtonGroup, Tabs, Tab} from '@tet/ui';
import {HELPDESK_URL, INDICATEURS_TRAJECTOIRE} from './constants';

/**
 * Affiche une trajectoire SNBC calculée
 */
const TrajectoireCalculee = () => {
  // indicateur (ges | énergie) sélectionné
  const [indicateurIdx, setIndicateurIdx] = useState<number>(0);
  const indicateur = INDICATEURS_TRAJECTOIRE[indicateurIdx];

  // secteur séléctionné
  const secteurs = [{nom: 'Tous les secteurs'}, ...(indicateur.secteurs || [])];
  const [secteurIdx, setSecteurIdx] = useState<number>(0);

  return (
    <div className="grow bg-grey-2 -mb-8 py-12">
      <div className="fr-container">
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
      </div>
    </div>
  );
};

export default TrajectoireCalculee;
