import { SelectActionStatut } from '@/app/referentiels/actions/action-statut/action-statut.select';
import {
  useEditActionStatutIsDisabled,
  useSaveActionStatut,
  useSaveActionStatuts,
} from '@/app/referentiels/actions/action-statut/use-action-statut';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  ActionStatutCreate,
  ActionTypeEnum,
  StatutAvancementCreate,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { Button } from '@tet/ui';
import { useEffect, useState } from 'react';
import { statutParAvancement } from '../utils';
import AvancementDetailleModal from './avancement-detaille/avancement-detaille.modal';
import SubActionModal from './sub-action/sub-action.modal';
import { useGetActionChildren } from './use-get-action-children';
import { ActionListItem } from './use-list-actions';

export type StatusToSavePayload = {
  actionId: string;
  statut: ActionStatutCreate | null;
  avancement: StatutAvancementCreate;
  avancementDetaille?: number[];
};

export type OpenModaleState = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

type Props = {
  action: ActionListItem;
};

export const SubActionStatutDropdown = ({ action }: Props) => {
  const collectivite = useCurrentCollectivite();

  // Détermine si l'édition du statut est désactivée
  const disabled = useEditActionStatutIsDisabled(action.actionId);

  // Fonction de sauvegarde du statut
  const { saveActionStatut } = useSaveActionStatut();
  const { mutate: saveActionStatuts } = useSaveActionStatuts();

  // Arguments renvoyés lors de la sauvegarde d'un nouveau statut
  const args = {
    actionId: action.actionId,
    collectiviteId: collectivite.collectiviteId,
  };

  // Informations sur l'avancement de la sous-mesure / tâche
  const { avancement, avancementDetaille } = action.score;
  const children = useGetActionChildren({ actionId: action.actionId });
  const filledByChildren = children
    .filter(
      (child) => child.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE
    )
    .map((child) => child.actionId);

  // Statut et tableau d'avancement détaillé locaux au dropdown
  const [localAvancement, setLocalAvancement] = useState<
    StatutAvancementCreate | undefined
  >(avancement);
  const [localAvancementDetaille, setLocalAvancementDetaille] =
    useState(avancementDetaille);

  // Gestion de l'ouverture des modales de score détaillé
  const [openSubActionModal, setOpenSubActionModal] = useState(false);
  const [openScoreDetaille, setOpenScoreDetaille] = useState(false);

  const isSubActionWithTasks =
    action.actionType === ActionTypeEnum.SOUS_ACTION &&
    action.childrenIds.length > 0;

  // Mise à jour du dropdown quand le statut change (ex: enfant modifié)
  useEffect(() => {
    setLocalAvancement(avancement);
    setLocalAvancementDetaille(avancementDetaille);
  }, [avancement, avancementDetaille]);

  // Mise à jour du statut lorsque une nouvelle valeur
  // est sélectionnée sur le dropdown
  const handleChange = (value: StatutAvancementCreate) => {
    const { avancement, concerne, avancementDetaille } =
      statutParAvancement(value);

    const argsToSave = {
      ...args,
      avancement,
      avancementDetaille,
      concerne,
    };

    // Logique de sauvegarde à revoir si remplacement
    // de la modale <SubActionModal /> par un panneau latéral
    if (avancement === 'detaille') {
      setLocalAvancementDetaille(avancementDetaille);
      setOpenScoreDetaille(true);
    } else if (value === 'detaille_a_la_tache') {
      setLocalAvancementDetaille(undefined);
      setOpenSubActionModal(true);
    } else {
      // Mise à jour dans les cas de statuts autres que détaillé
      setLocalAvancement(value);
      setLocalAvancementDetaille(avancementDetaille);

      // Sauvegarde du nouveau statut
      if (
        argsToSave.avancement !== 'non_renseigne' ||
        !filledByChildren?.length
      ) {
        saveActionStatut({
          ...argsToSave,
          avancementDetaille:
            action.actionType === ActionTypeEnum.SOUS_ACTION
              ? localAvancementDetaille
              : avancementDetaille,
        });
      } else {
        // Save the statut of the children to non_renseigne
        const childActionStatuts: ActionStatutCreate[] = filledByChildren.map(
          (childActionId) => ({
            collectiviteId: collectivite.collectiviteId,
            actionId: childActionId,
            avancement: 'non_renseigne',
            avancementDetaille: null,
            concerne: true,
          })
        );
        saveActionStatuts({
          actionStatuts: [
            {
              collectiviteId: collectivite.collectiviteId,
              actionId: action.actionId,
              avancement: 'non_renseigne',
              avancementDetaille: null,
              concerne: true,
            },
            ...childActionStatuts,
          ],
        });
      }
    }
  };

  const showPenButton =
    !disabled &&
    (localAvancement === 'detaille' ||
      localAvancement === 'detaille_a_la_tache');

  const allOrderedStatutItems = [
    StatutAvancementEnum.FAIT,
    StatutAvancementEnum.PAS_FAIT,
    StatutAvancementEnum.PROGRAMME,
    StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
    StatutAvancementEnum.DETAILLE_A_LA_TACHE,
    StatutAvancementEnum.NON_CONCERNE,
    StatutAvancementEnum.NON_RENSEIGNE,
  ];
  const filteredStatutItems = isSubActionWithTasks
    ? allOrderedStatutItems
    : allOrderedStatutItems.filter(
        (item) => item !== StatutAvancementEnum.DETAILLE_A_LA_TACHE
      );

  return (
    <>
      {/* Dropdown + bouton crayon pour ouvrir la modale détaillée */}
      <div
        onClick={(evt) => evt.stopPropagation()}
        className="flex items-center gap-2 mr-2"
      >
        <SelectActionStatut
          items={filteredStatutItems}
          disabled={disabled}
          value={localAvancement}
          onChange={handleChange}
        />
        {showPenButton && (
          <Button
            data-test="DetaillerAvancementButton"
            icon="edit-line"
            title="Détailler l'avancement"
            variant="underlined"
            size="xs"
            onClick={() => {
              if (localAvancement === 'detaille_a_la_tache') {
                setOpenSubActionModal(true);
              } else {
                setOpenScoreDetaille(true);
              }
            }}
          />
        )}
      </div>
      {/* Modale de détail de la sous-action (liste des tâches + jaude de score détaillé) */}
      {openSubActionModal && (
        <div onClick={(evt) => evt.stopPropagation()}>
          <SubActionModal
            action={action}
            openState={{
              isOpen: openSubActionModal,
              setIsOpen: (value) => {
                setOpenSubActionModal(value);
              },
            }}
          />
        </div>
      )}

      {/* Modale de score détaillé */}
      {openScoreDetaille && (
        <div onClick={(evt) => evt.stopPropagation()}>
          <AvancementDetailleModal
            key={JSON.stringify(action.score)}
            action={action}
            openState={{
              isOpen: openScoreDetaille,
              setIsOpen: (value) => {
                setOpenScoreDetaille(value);
              },
            }}
          />
        </div>
      )}
    </>
  );
};
