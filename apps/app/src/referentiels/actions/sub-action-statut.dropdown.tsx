import { SelectActionStatut } from '@/app/referentiels/actions/action-statut/action-statut.select';
import { useEditActionStatutIsDisabled } from '@/app/referentiels/actions/action-statut/use-action-statut';
import {
  ActionStatutCreate,
  ActionTypeEnum,
  StatutAvancement,
  StatutAvancementCreate,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { ActionStatutDetailleALaTacheModal } from './action-statut/action-statut-detaille-a-la-tache.modal';
import { ActionStatutDetailleAuPourcentageModal } from './action-statut/action-statut-detaille-au-pourcentage.modal';
import ActionStatutBadge from './action-statut/action-statut.badge';
import { useUpdateActionStatut } from './action-statut/use-update-action-statut';
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

const sousActionStatuts = [
  StatutAvancementEnum.NON_RENSEIGNE,
  StatutAvancementEnum.FAIT,
  StatutAvancementEnum.PAS_FAIT,
  StatutAvancementEnum.PROGRAMME,
  StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
  StatutAvancementEnum.DETAILLE_A_LA_TACHE,
  StatutAvancementEnum.NON_CONCERNE,
];

const tacheStatuts = [
  StatutAvancementEnum.NON_RENSEIGNE,
  StatutAvancementEnum.FAIT,
  StatutAvancementEnum.PAS_FAIT,
  StatutAvancementEnum.PROGRAMME,
  StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
  StatutAvancementEnum.NON_CONCERNE,
];

export const SubActionStatutDropdown = ({ action }: Props) => {
  // Détermine si l'édition du statut est désactivée
  const disabled = useEditActionStatutIsDisabled(action.actionId);

  // Fonction de sauvegarde du statut
  const { mutate: updateActionStatut } = useUpdateActionStatut();

  // Gestion de l'ouverture des modales de score détaillé
  const [
    openActionStatutDetailleALaTacheModal,
    setOpenActionStatutDetailleALaTacheModal,
  ] = useState(false);
  const [
    openStatutDetailleAuPourcentageModal,
    setOpenStatutDetailleAuPourcentageModal,
  ] = useState(false);

  const [statut, setStatut] = useState<StatutAvancement>(
    action.score.statut ?? StatutAvancementEnum.NON_RENSEIGNE
  );

  const isSousActionWithTasks =
    action.actionType === ActionTypeEnum.SOUS_ACTION &&
    action.childrenIds.length > 0;

  const statutItems = isSousActionWithTasks ? sousActionStatuts : tacheStatuts;

  const hasStatutDetaille =
    !disabled &&
    (statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE ||
      statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE);

  if (disabled) {
    return <ActionStatutBadge statut={statut} />;
  }

  const openStatutDetailleModal = (
    statut: Extract<StatutAvancementCreate, 'detaille_a_la_tache' | 'detaille'>
  ) => {
    if (statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE) {
      setOpenActionStatutDetailleALaTacheModal(true);
    } else {
      setOpenStatutDetailleAuPourcentageModal(true);
    }
  };

  const onChangeStatut = (statut: StatutAvancementCreate) => {
    if (
      statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE ||
      statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE
    ) {
      openStatutDetailleModal(statut);
      return;
    }

    setStatut(statut);

    updateActionStatut({
      actionId: action.actionId,
      statut,
    });
  };

  return (
    <>
      {/* Dropdown + bouton crayon pour ouvrir la modale détaillée */}
      <div
        onClick={(evt) => evt.stopPropagation()}
        className="flex items-center gap-2 mr-2"
      >
        <SelectActionStatut
          items={statutItems}
          value={statut}
          onChange={onChangeStatut}
        />

        {hasStatutDetaille && (
          <Button
            data-test="DetaillerAvancementButton"
            icon="edit-line"
            title="Détailler l'avancement"
            variant="underlined"
            size="xs"
            onClick={() => openStatutDetailleModal(statut)}
          />
        )}
      </div>

      {/* Modale de détail de la sous-action (liste des tâches + jauge de score détaillé) */}
      {openActionStatutDetailleALaTacheModal && (
        <div onClick={(evt) => evt.stopPropagation()}>
          <ActionStatutDetailleALaTacheModal
            action={action}
            openState={{
              isOpen: openActionStatutDetailleALaTacheModal,
              setIsOpen: (value) => {
                setOpenActionStatutDetailleALaTacheModal(value);
              },
            }}
          />
        </div>
      )}

      {/* Modale de score détaillé */}
      {openStatutDetailleAuPourcentageModal && (
        <div onClick={(evt) => evt.stopPropagation()}>
          <ActionStatutDetailleAuPourcentageModal
            key={JSON.stringify(action.score)}
            action={action}
            openState={{
              isOpen: openStatutDetailleAuPourcentageModal,
              setIsOpen: (value) => {
                setOpenStatutDetailleAuPourcentageModal(value);
              },
            }}
          />
        </div>
      )}
    </>
  );
};
