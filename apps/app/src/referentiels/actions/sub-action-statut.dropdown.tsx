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
  statutAvancementEnumCreateSchema,
} from '@tet/domain/referentiels';
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
  /** Contrôle externe des modale de score détaillé */
  openDetailledState?: OpenModaleState;
};

export const SubActionStatutDropdown = ({
  action,
  openDetailledState,
}: Props) => {
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

  const handleDetailleState = (state = false) => {
    if (!disabled && localAvancement === 'detaille') {
      if (
        action.actionType === ActionTypeEnum.SOUS_ACTION &&
        action.childrenIds.length > 0
      ) {
        setOpenSubActionModal(state);
      } else {
        setOpenScoreDetaille(state);
      }
      openDetailledState?.setIsOpen(state);
    }
  };

  useEffect(() => {
    handleDetailleState(openDetailledState?.isOpen);
  }, [openDetailledState?.isOpen]);

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
      if (
        action.actionType === ActionTypeEnum.SOUS_ACTION &&
        action.childrenIds.length > 0
      ) {
        setLocalAvancementDetaille(undefined);

        setOpenSubActionModal(true);
        openDetailledState?.setIsOpen(true);
      } else {
        setLocalAvancementDetaille(avancementDetaille);

        setOpenScoreDetaille(true);
        openDetailledState?.setIsOpen(true);
      }
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

  return (
    <>
      {/* Dropdown avec suppression de l'option "non renseigné" sur les sous-actions
          quand au moins une des tâches a un statut */}
      <div onClick={(evt) => evt.stopPropagation()} className="flex">
        <SelectActionStatut
          items={statutAvancementEnumCreateSchema.options}
          disabled={disabled}
          value={localAvancement}
          onChange={handleChange}
        />
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
                openDetailledState?.setIsOpen(value);
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
                openDetailledState?.setIsOpen(value);
              },
            }}
          />
        </div>
      )}
    </>
  );
};
