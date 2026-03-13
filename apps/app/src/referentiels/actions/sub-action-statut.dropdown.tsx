import { SelectActionStatut } from '@/app/referentiels/actions/action-statut/action-statut.select';
import {
  useActionStatut,
  useEditActionStatutIsDisabled,
  useSaveActionStatut,
  useSaveActionStatuts,
} from '@/app/referentiels/actions/action-statut/use-action-statut';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  ActionStatutCreate,
  ActionTypeEnum,
  StatutAvancementIncludingNonConcerne,
  statutAvancementIncludingNonConcerneEnumSchema,
} from '@tet/domain/referentiels';
import { useEffect, useState } from 'react';
import { statutParAvancement } from '../utils';
import AvancementDetailleModal from './avancement-detaille/avancement-detaille.modal';
import SubActionModal from './sub-action/sub-action.modal';

export type StatusToSavePayload = {
  actionId: string;
  statut: ActionStatutCreate | null;
  avancement: StatutAvancementIncludingNonConcerne;
  avancementDetaille?: number[];
};

export type OpenModaleState = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

type Props = {
  actionDefinition: ActionDefinitionSummary;
  /** Contrôle externe des modale de score détaillé */
  openDetailledState?: OpenModaleState;
};

export const SubActionStatutDropdown = ({
  actionDefinition,
  openDetailledState,
}: Props) => {
  const collectivite = useCurrentCollectivite();

  // Détermine si l'édition du statut est désactivée
  const disabled = useEditActionStatutIsDisabled(actionDefinition.id);

  // Fonction de sauvegarde du statut
  const { saveActionStatut } = useSaveActionStatut();
  const { mutate: saveActionStatuts } = useSaveActionStatuts();

  // Arguments renvoyés lors de la sauvegarde d'un nouveau statut
  const args = {
    actionId: actionDefinition.id,
    collectiviteId: collectivite.collectiviteId,
  };

  // Informations sur l'avancement de la sous-mesure / tâche
  const { statut, filledByChildren } = useActionStatut(actionDefinition.id);
  const { avancementDetaille } = statut || {};

  // Statut et tableau d'avancement détaillé locaux au dropdown
  const [localAvancement, setLocalAvancement] = useState<
    StatutAvancementIncludingNonConcerne | undefined
  >(statut?.avancement);
  const [localAvancementDetaille, setLocalAvancementDetaille] =
    useState(avancementDetaille);

  // Gestion de l'ouverture des modales de score détaillé
  const [openSubActionModal, setOpenSubActionModal] = useState(false);
  const [openScoreDetaille, setOpenScoreDetaille] = useState(false);

  const handleDetailleState = (state = false) => {
    if (!disabled && localAvancement === 'detaille') {
      if (
        actionDefinition.type === ActionTypeEnum.SOUS_ACTION &&
        actionDefinition.children.length > 0
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
    setLocalAvancement(statut?.avancement);
    setLocalAvancementDetaille(statut?.avancementDetaille);
  }, [statut?.avancement, statut?.avancementDetaille]);

  // Mise à jour du statut lorsque une nouvelle valeur
  // est sélectionnée sur le dropdown
  const handleChange = (value: StatutAvancementIncludingNonConcerne) => {
    const { avancement, concerne, avancementDetaille } =
      statutParAvancement(value);

    const argsToSave = {
      ...args,
      ...statut,
      avancement,
      avancementDetaille,
      concerne,
    };

    // Logique de sauvegarde à revoir si remplacement
    // de la modale <SubActionModal /> par un panneau latéral
    if (avancement === 'detaille') {
      if (
        actionDefinition.type === ActionTypeEnum.SOUS_ACTION &&
        actionDefinition.children.length > 0
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
            actionDefinition.type === ActionTypeEnum.SOUS_ACTION
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
              actionId: actionDefinition.id,
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
          items={statutAvancementIncludingNonConcerneEnumSchema.options}
          disabled={disabled}
          value={localAvancement}
          onChange={handleChange}
        />
      </div>

      {/* Modale de détail de la sous-action (liste des tâches + jaude de score détaillé) */}
      {openSubActionModal && (
        <div onClick={(evt) => evt.stopPropagation()}>
          <SubActionModal
            actionDefinition={actionDefinition}
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
            actionDefinition={actionDefinition}
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
