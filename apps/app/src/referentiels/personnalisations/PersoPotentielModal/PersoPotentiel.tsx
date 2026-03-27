import { useState } from 'react';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Button, Modal } from '@tet/ui';
import { ActionListItem } from '../../actions/use-list-actions';
import { useQuestionsReponses } from '../PersoReferentielThematique/useQuestionsReponses';
import { PersoPotentielTabs } from './PersoPotentielTabs';
import { PointsPotentiels } from './points-potentiels.label';
import { useChangeReponseHandler } from './useChangeReponseHandler';
import { useRegles } from './useRegles';

export type TPersoPotentielButtonProps = {
  action: ActionListItem;
};

/**
 * Affiche le potentiel de points (éventuellement réduit/augmenté), ainsi que le
 * bouton permettant d'ouvrir le dialogue "personnaliser le potentiel de points"
 * d'une action, et le dialogue lui-même
 */
export const PersoPotentiel = ({ action }: TPersoPotentielButtonProps) => {
  const { actionId, actionType, identifiant, nom } = action;

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
        <PointsPotentiels score={action.score} />

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
          actionType[0].toUpperCase() + actionType.slice(1)
        } ${identifiant} : ${nom}`}
        render={() => (
          <PersoPotentielTabs
            action={action}
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
