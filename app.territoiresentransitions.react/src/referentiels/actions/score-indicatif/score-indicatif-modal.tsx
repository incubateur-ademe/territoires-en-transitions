import { useCollectiviteId } from '@/api/collectivites/collectivite-context';
import { useIndicateurDefinition } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useIndicateurDefinition';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { ScoreIndicatifDonnees } from '@/app/referentiels/actions/score-indicatif/score-indicatif-donnees';
import Markdown from '@/app/ui/Markdown';
import {
  Alert,
  Button,
  Card,
  Divider,
  Modal,
  ModalFooterOKCancel,
  Tab,
  Tabs,
} from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import { LibelleValeurSelectionnee } from './score-indicatif';
import { ScoreIndicatifAction, ScoreIndicatifValeursIndicateur } from './types';
import { useGetValeursUtilisees } from './use-get-valeurs-utilisees';

export type ScoreIndicatifModalProps = {
  scoreIndicatif: ScoreIndicatifAction;
  openState: OpenState;
};

/**
 * Affiche le dialogue d'édition des valeurs d'indicateur(s) pour le calcul d'un score indicatif
 *
 * Un état intermédiaire permettant la sélection de l'indicateur à renseigner
 * est affiché quand le calcul utilise plusieurs indicateurs.
 */
export const ScoreIndicatifModal = (props: ScoreIndicatifModalProps) => {
  const { scoreIndicatif, openState } = props;
  const nbIndicateurs = scoreIndicatif?.indicateurs?.length || 0;
  const [indicateurIndex, setIndicateurIndex] = useState(0);
  const [isOpenSelectVal, setIsOpenSelectVal] = useState(false);
  if (!nbIndicateurs) return;

  const indicateurId = scoreIndicatif.indicateurs[indicateurIndex].indicateurId;
  return (
    <Modal
      openState={openState}
      size="xl"
      disableDismiss
      noCloseButton
      render={() =>
        /** affiche les données de l'indicateur quand il y en a un seul ou que
         * l'utilisateur en a sélectionné un */
        nbIndicateurs === 1 || isOpenSelectVal ? (
          <ScoreIndicatifModalIndicateurTabs
            {...props}
            openState={{
              ...openState,
              setIsOpen: isOpenSelectVal
                ? setIsOpenSelectVal
                : openState.setIsOpen,
            }}
            indicateurId={indicateurId}
          />
        ) : (
          /** affiche le sélecteur d'indicateur quand il y en a plus d'un */
          <ScoreIndicatifModalIndicateurs
            {...props}
            onSelect={(idx) => {
              setIndicateurIndex(idx);
              setIsOpenSelectVal(true);
            }}
          />
        )
      }
    />
  );
};

/**
 * Affiche le sélecteur d'indicateurs quand le calcul utilise plusieurs indicateurs
 */
const ScoreIndicatifModalIndicateurs = (
  props: ScoreIndicatifModalProps & { onSelect: (index: number) => void }
) => {
  const { scoreIndicatif, openState, onSelect } = props;
  const nbIndicateurs = scoreIndicatif?.indicateurs?.length || 0;

  return (
    <div>
      <h3 className="text-center">Renseigner les données des indicateurs</h3>
      <Alert
        className="border-8 border-info-2 rounded-lg"
        state="info"
        title={`${
          nbIndicateurs === 2 ? 'Deux' : nbIndicateurs
        } indicateurs sont nécessaires au calcul du score de cette tâche.`}
      />
      <div className="grid grid-flow-col gap-4 my-8">
        {scoreIndicatif.indicateurs.map((indicateur, idx) => (
          <ScoreIndicatifModalIndicateurCard
            key={indicateur.indicateurId}
            {...props}
            idx={idx}
            indicateur={indicateur}
            onSelect={onSelect}
          />
        ))}
      </div>
      <ModalFooterOKCancel
        btnOKProps={{
          onClick: () => openState.setIsOpen(false),
          children: 'Fermer',
        }}
      />
    </div>
  );
};

/**
 * Affiche une carte d'un indicateur utilisé dans le calcul du score indicatif
 */
const ScoreIndicatifModalIndicateurCard = (
  props: ScoreIndicatifModalProps & {
    idx: number;
    indicateur: Pick<
      ScoreIndicatifValeursIndicateur,
      'indicateurId' | 'titre' | 'unite'
    >;
    onSelect: (index: number) => void;
  }
) => {
  const { scoreIndicatif, idx, indicateur, onSelect } = props;
  const { indicateurId, titre, unite } = indicateur;
  const { data: valeurUtilisees } = useGetValeursUtilisees(
    scoreIndicatif.actionId,
    indicateurId
  );

  return (
    <Card key={indicateurId} onClick={() => onSelect(idx)}>
      <span>
        {titre} <span className="text-grey-6">({unite})</span>
      </span>
      <Divider />
      <ul className="font-normal list-disc pl-4">
        <li>
          <LibelleValeurSelectionnee
            indicateurId={indicateurId}
            unite={unite}
            valeurUtilisees={valeurUtilisees}
            typeScore="fait"
          />
        </li>
        <li>
          <LibelleValeurSelectionnee
            indicateurId={indicateurId}
            unite={unite}
            valeurUtilisees={valeurUtilisees}
            typeScore="programme"
          />
        </li>
      </ul>
    </Card>
  );
};

/**
 * Affiche les onglets avec les informations sur l'indicateur et les champs de
 * sélection des valeurs à utiliser pour le calcul du score indicatif
 */
const ScoreIndicatifModalIndicateurTabs = (
  props: ScoreIndicatifModalProps & { indicateurId: number }
) => {
  const { scoreIndicatif, indicateurId } = props;
  const indicateur = scoreIndicatif?.indicateurs.find(
    (ind) => ind.indicateurId === indicateurId
  );
  const { identifiantReferentiel, titre, unite } = indicateur || {};
  const collectiviteId = useCollectiviteId();
  const { data: definition } = useIndicateurDefinition(indicateurId);
  const indicateurURL = makeCollectiviteIndicateursUrl({
    collectiviteId,
    indicateurView: 'cae',
    identifiantReferentiel,
  });
  const [currentTab, setCurrentTab] = useState(0);

  if (!indicateur || !scoreIndicatif) return;
  return (
    <div>
      <h3>
        {titre} <sup className="text-grey-6">({unite})</sup>
      </h3>
      <Tabs
        defaultActiveTab={currentTab}
        onChange={(activeTab) => {
          if (activeTab === 2) {
            window.open(indicateurURL, '_blank');
            setCurrentTab(0);
          }
        }}
      >
        <Tab label="Données">
          {definition && (
            <ScoreIndicatifDonnees definition={definition} {...props} />
          )}
        </Tab>
        <Tab label="Informations sur l'indicateur">
          {definition?.description && (
            <Markdown
              content={definition.description}
              className="bg-white p-10 border border-grey-3 rounded-xl paragraphe-16 paragraphe-primary-9"
            />
          )}
        </Tab>
        <Tab
          label="Voir la fiche de l’indicateur"
          icon="external-link-line"
          iconPosition="right"
        >
          <Button className="mx-auto my-10" href={indicateurURL}>
            Voir la fiche de l’indicateur
          </Button>
        </Tab>
      </Tabs>
    </div>
  );
};
