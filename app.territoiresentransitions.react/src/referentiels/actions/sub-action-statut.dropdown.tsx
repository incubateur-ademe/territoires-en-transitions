import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { SelectActionStatut } from '@/app/referentiels/actions/action-statut/action-statut.select';
import {
  useActionStatut,
  useEditActionStatutIsDisabled,
  useSaveActionStatut,
} from '@/app/referentiels/actions/action-statut/use-action-statut';
import {
  ActionStatutInsert,
  ActionTypeEnum,
  StatutAvancementIncludingNonConcerne,
  getStatutAvancement,
  statutAvancementIncludingNonConcerneEnumSchema,
} from '@/domain/referentiels';
import { Button, Tooltip } from '@/ui';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { useScore } from '../use-snapshot';
import { statutParAvancement } from '../utils';
import AvancementDetailleModal from './avancement-detaille/avancement-detaille.modal';
import SubActionModal from './sub-action/sub-action.modal';

export type StatusToSavePayload = {
  actionId: string;
  statut: ActionStatutInsert | null;
  avancement: StatutAvancementIncludingNonConcerne;
  avancementDetaille?: number[];
};

type Props = {
  actionDefinition: ActionDefinitionSummary;
  statusWarningMessage?: boolean;
  /** Permet le contrôle externe de la modale de score détaillé */
  openScoreDetailleState?: {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
  };
};

export const SubActionStatutDropdown = ({
  actionDefinition,
  statusWarningMessage = false,
  openScoreDetailleState,
}: Props) => {
  const score = useScore(actionDefinition.id);

  const collectivite = useCurrentCollectivite();

  const [openSubActionModal, setOpenSubActionModal] = useState(false);
  const [openScoreDetaille, setOpenScoreDetaille] = useState(
    openScoreDetailleState?.isOpen ?? false
  );

  useEffect(
    () => setOpenScoreDetaille(openScoreDetailleState?.isOpen ?? false),
    [openScoreDetailleState?.isOpen]
  );

  const args = {
    actionId: actionDefinition.id,
    collectiviteId: collectivite?.collectiviteId || 0,
  };
  const { statut, filled } = useActionStatut(actionDefinition.id);
  const { avancement, avancementDetaille, concerne } = statut || {};

  const desactive = score?.desactive;

  /**
   * @deprecated Supprimer cette logique du front pour la faire uniquement côté back
   * Le `useActionStatut` devrait déjà renvoyer le bon statut à manipuler directement dans le front
   */
  const avancementExt = getStatutAvancement({
    avancement: avancement,
    desactive,
    concerne,
  });

  const { saveActionStatut } = useSaveActionStatut();

  const [localAvancement, setLocalAvancement] = useState(avancementExt);
  const [localAvancementDetaille, setLocalAvancementDetaille] =
    useState(avancementDetaille);

  // Détermine si l'édition du statut est désactivée
  const disabled = useEditActionStatutIsDisabled(actionDefinition.id);

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
      } else {
        setLocalAvancement('detaille');
        setLocalAvancementDetaille(avancement_detaille);
        saveActionStatut(argsToSave);

        setOpenScoreDetaille(true);
        openScoreDetailleState?.setIsOpen(true);
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

  if (!collectivite) return null;

  return (
    <div
      className="flex flex-col justify-between items-end gap-2 h-full w-fit shrink-0 ml-auto"
      onClick={(evt) => evt.stopPropagation()}
    >
      {/* Message d'avertissement lorsque le staut de la sous-action est détaillé */}
      <Tooltip
        label={
          <p className="w-96">
            Le score a été ajusté manuellement à la sous-action : la
            modification du statut de la tâche ne sera pas pris en compte pour
            le score.
          </p>
        }
        openingDelay={0}
        className={classNames({ hidden: !statusWarningMessage })}
      >
        <div>
          {/* Dropdown avec suppression de l'option "non renseigné" sur les sous-actions
          quand au moins une des tâches a un statut */}
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
            buttonClassName="-mr-2 -mt-2"
          />
        </div>
      </Tooltip>

      {/* Cas particulier des statuts "détaillé" pour les sous-actions */}
      {localAvancement === 'detaille' &&
        actionDefinition.type === ActionTypeEnum.SOUS_ACTION &&
        !desactive && (
          <div className="flex flex-col gap-3 items-end w-full pr-1">
            {/* Bouton d'ouverture de la modale pour détailler le score */}
            {!disabled && (
              <Button
                variant="underlined"
                size="sm"
                onClick={() => setOpenSubActionModal(true)}
              >
                Détailler l&apos;avancement
              </Button>
            )}
          </div>
        )}

      {/* Modale de détail de la sous-action (liste des tâches + jaude de score détaillé) */}
      {openSubActionModal && (
        <SubActionModal
          actionDefinition={actionDefinition}
          openState={{
            isOpen: openSubActionModal,
            setIsOpen: setOpenSubActionModal,
          }}
        />
      )}

      {/* Modale de score détaillé */}
      {openScoreDetaille && (
        <AvancementDetailleModal
          actionDefinition={actionDefinition}
          openState={{
            isOpen: openScoreDetaille,
            setIsOpen: (value) => {
              setOpenScoreDetaille(value);
              openScoreDetailleState?.setIsOpen(value);
            },
          }}
        />
      )}
    </div>
  );
};
