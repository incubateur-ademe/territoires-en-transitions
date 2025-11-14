import { useCurrentCollectivite } from '@/api/collectivites';
import { SelectActionStatut } from '@/app/referentiels/actions/action-statut/action-statut.select';
import {
  useActionStatut,
  useEditActionStatutIsDisabled,
  useSaveActionStatut,
} from '@/app/referentiels/actions/action-statut/use-action-statut';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import {
  ActionStatutCreate,
  ActionTypeEnum,
  StatutAvancementIncludingNonConcerne,
  getStatutAvancement,
  statutAvancementIncludingNonConcerneEnumSchema,
} from '@/domain/referentiels';
import { useEffect, useState } from 'react';
import { useScore } from '../use-snapshot';
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

  // Récupère les données liées au score
  const score = useScore(actionDefinition.id);

  // Fonction de sauvegarde du statut
  const { saveActionStatut } = useSaveActionStatut();

  // Arguments renvoyés lors de la sauvegarde d'un nouveau statut
  const args = {
    actionId: actionDefinition.id,
    collectiviteId: collectivite.collectiviteId,
  };

  // Informations sur l'avancement de la sous-mesure / tâche
  const { statut, filled } = useActionStatut(actionDefinition.id);
  const { avancement, avancementDetaille, concerne } = statut || {};

  /**
   * @deprecated Supprimer cette logique du front pour la faire uniquement côté back
   * Le `useActionStatut` devrait déjà renvoyer le bon statut à manipuler directement dans le front
   */
  const avancementExt = getStatutAvancement({
    avancement: avancement,
    desactive: score?.desactive,
    concerne,
  });

  // Statut et tableau d'avancement détaillé locaux au dropdown
  const [localAvancement, setLocalAvancement] = useState(avancementExt);
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

  // Permet la mise à jour du dropdown si un autre élément
  // de la sous-action a changé de statut
  useEffect(() => {
    if (
      actionDefinition.type === 'sous-action' &&
      avancementExt === 'non_renseigne' &&
      concerne !== false &&
      filled
    ) {
      setLocalAvancement('detaille');
    } else {
      setLocalAvancement(avancementExt);
    }
    setLocalAvancementDetaille(avancementDetaille);
  }, [
    avancementExt,
    avancementDetaille,
    concerne,
    filled,
    actionDefinition.type,
  ]);

  // Mise à jour du statut lorsque une nouvelle valeur
  // est sélectionnée sur le dropdown
  const handleChange = (value: StatutAvancementIncludingNonConcerne) => {
    const {
      avancement,
      concerne,
      avancementDetaille: avancement_detaille,
    } = statutParAvancement(value);

    const argsToSave = {
      ...args,
      ...statut,
      avancement,
      avancementDetaille: avancement_detaille,
      concerne,
    };

    // Logique de sauvegarde à revoir si remplacement
    // de la modale <SubActionModal /> par un panneau latéral
    if (avancement === 'detaille') {
      if (
        actionDefinition.type === ActionTypeEnum.SOUS_ACTION &&
        actionDefinition.children.length > 0
      ) {
        setLocalAvancement('detaille');
        setLocalAvancementDetaille(undefined);
        saveActionStatut({
          ...argsToSave,
          avancement: 'non_renseigne',
          avancementDetaille: undefined,
        });

        setOpenSubActionModal(true);
        openDetailledState?.setIsOpen(true);
      } else {
        setLocalAvancement('detaille');
        setLocalAvancementDetaille(avancement_detaille);
        saveActionStatut(argsToSave);

        setOpenScoreDetaille(true);
        openDetailledState?.setIsOpen(true);
      }
    } else {
      // Mise à jour dans les cas de statuts autres que détaillé
      setLocalAvancement(value);
      setLocalAvancementDetaille(avancement_detaille);

      // Sauvegarde du nouveau statut
      saveActionStatut({
        ...argsToSave,
        avancementDetaille:
          actionDefinition.type === ActionTypeEnum.SOUS_ACTION
            ? localAvancementDetaille
            : avancement_detaille,
      });
    }
  };

  return (
    <>
      {/* Dropdown avec suppression de l'option "non renseigné" sur les sous-actions
          quand au moins une des tâches a un statut */}
      <div onClick={(evt) => evt.stopPropagation()} className="flex">
        <SelectActionStatut
          items={
            actionDefinition.type === ActionTypeEnum.SOUS_ACTION &&
            localAvancement !== 'non_renseigne' &&
            filled
              ? statutAvancementIncludingNonConcerneEnumSchema.options.filter(
                  (item) => item !== 'non_renseigne'
                )
              : statutAvancementIncludingNonConcerneEnumSchema.options
          }
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
