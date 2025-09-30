import { useCollectiviteId } from '@/api/collectivites';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { useGetIndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import Markdown from '@/app/ui/Markdown';
import {
  TypeScoreIndicatif,
  typeScoreIndicatifEnum,
} from '@/domain/referentiels';
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
import { uniqBy } from 'es-toolkit';
import { useState } from 'react';
import { ScoreIndicatifDonnees } from './score-indicatif.donnees';
import { LibelleValeurSelectionnee } from './score-indicatif.libelle';
import {
  ScoreIndicatifAction,
  ScoreIndicatifValeursIndicateur,
} from './score-indicatif.types';
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
 * Détermine si des années différentes ont été selectionnées pour le même type de score
 */
const anneesDifferentesSelectionnees = (
  scoreIndicatif: ScoreIndicatifAction,
  typeScore: TypeScoreIndicatif
) =>
  uniqBy(scoreIndicatif[typeScore]?.valeursUtilisees || [], (v) =>
    new Date(v.dateValeur).getFullYear()
  ).length > 1;

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
        description={
          <span>
            <span className="font-semibold">La même année</span> pour les
            valeurs résultat et objectif doit être sélectionnée pour chaque
            indicateur.
          </span>
        }
      />
      {anneesDifferentesSelectionnees(
        scoreIndicatif,
        typeScoreIndicatifEnum.FAIT
      ) && (
        <Alert
          className="border-8 border-error-2 rounded-lg mt-2"
          state="error"
          title={`Des années différentes ont été choisies pour les valeurs résultats entre les ${nbIndicateurs} indicateurs`}
        />
      )}
      {anneesDifferentesSelectionnees(
        scoreIndicatif,
        typeScoreIndicatifEnum.PROGRAMME
      ) && (
        <Alert
          className="border-8 border-error-2 rounded-lg mt-2"
          state="error"
          title={`Des années différentes ont été choisies pour les valeurs objectifs entre les ${nbIndicateurs} indicateurs`}
        />
      )}
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
  const { data: definition } = useGetIndicateurDefinition(
    indicateurId,
    collectiviteId
  );
  const indicateurURL = makeCollectiviteIndicateursUrl({
    collectiviteId,
    indicateurView: 'cae',
    identifiantReferentiel,
  });

  if (!indicateur || !scoreIndicatif) return;
  return (
    <div>
      <h3 className="mb-2">
        {titre} <sup className="text-grey-6">({unite})</sup>
      </h3>
      <Button
        className="mb-4"
        variant="underlined"
        size="sm"
        href={indicateurURL}
        external
      >
        Voir la fiche de l’indicateur
      </Button>
      <Tabs>
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
      </Tabs>
    </div>
  );
};
