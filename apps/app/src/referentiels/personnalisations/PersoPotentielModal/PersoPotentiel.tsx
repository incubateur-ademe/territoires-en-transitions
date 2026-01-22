import { useState } from 'react';

import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Button, Modal } from '@tet/ui';
import { useQuestionsReponses } from '../PersoReferentielThematique/useQuestionsReponses';
import { PersoPotentielTabs } from './PersoPotentielTabs';
import { PointsPotentiels } from './points-potentiels.label';
import { useChangeReponseHandler } from './useChangeReponseHandler';
import { useRegles } from './useRegles';

export type TPersoPotentielButtonProps = {
  /** Définition de l'action */
  actionDef: ActionDefinitionSummary;
};

/**
 * Affiche le potentiel de points (éventuellement réduit/augmenté), ainsi que le
 * bouton permettant d'ouvrir le dialogue "personnaliser le potentiel de points"
 * d'une action, et le dialogue lui-même
 */
export const PersoPotentiel = ({ actionDef }: TPersoPotentielButtonProps) => {
  const { id: actionId, type, identifiant, nom } = actionDef;

  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const [isOpen, setIsOpen] = useState(false);

  const qr = useQuestionsReponses({ action_ids: [actionId] });
  const regles = useRegles(actionId);
  const handleChange = useChangeReponseHandler(collectiviteId, [
    getReferentielIdFromActionId(actionId),
  ]);

  return (
    <>
      <div
        data-test="PersoPotentiel"
        className="flex items-center"
        onClick={(event) => event.stopPropagation()}
      >
        <PointsPotentiels actionId={actionId} />

        <Button
          className="ml-2"
          variant="underlined"
          size="sm"
          icon="settings-5-line"
          onClick={() => setIsOpen(true)}
        >
          Personnaliser
        </Button>
      </div>
      <Modal
        dataTest="PersoPotentielDlg"
        size="lg"
        openState={{ isOpen, setIsOpen }}
        title="Personnaliser le potentiel de points"
        subTitle={`${
          type[0].toUpperCase() + type.slice(1)
        } ${identifiant} : ${nom}`}
        render={() => (
          <PersoPotentielTabs
            actionDef={actionDef}
            questionReponses={qr}
            regles={regles}
            onChange={handleChange}
            canEdit={hasCollectivitePermission('referentiels.mutate')}
          />
        )}
      />
    </>
  );
};
