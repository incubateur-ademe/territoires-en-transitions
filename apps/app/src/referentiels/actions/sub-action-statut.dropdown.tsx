import { useEditActionStatutIsDisabled } from '@/app/referentiels/actions/action-statut/use-action-statut';
import {
  ActionStatutCreate,
  StatutAvancement,
  StatutAvancementCreate,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { ComponentProps } from 'react';
import ActionStatutBadge from './action-statut/action-statut.badge';
import { ActionStatutDropdown } from './action-statut/action-statut.dropdown';
import { OpenActionStatutDetailleModalButton } from './action-statut/open-action-statut-detaille-modal.button';
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
  selectProps?: Omit<
    ComponentProps<typeof ActionStatutDropdown>,
    'action' | 'value' | 'onChange'
  >;
};

export const ActionStatutDropdownWithDetailleButton = ({
  action,
  selectProps = {},
}: Props) => {
  // Détermine si l'édition du statut est désactivée
  const disabled = useEditActionStatutIsDisabled(action.actionId);

  // Fonction de sauvegarde du statut
  const { mutate: updateActionStatut } = useUpdateActionStatut();

  const statut: StatutAvancement =
    action.score.statut ?? StatutAvancementEnum.NON_RENSEIGNE;

  if (disabled) {
    return <ActionStatutBadge statut={statut} />;
  }

  const onChangeStatut = (statut: StatutAvancementCreate) => {
    if (
      statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE ||
      statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE
    ) {
      return;
    }

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
        {statut !== StatutAvancementEnum.NON_RENSEIGNABLE && (
          <ActionStatutDropdown
            action={action}
            value={statut}
            onChange={onChangeStatut}
            buttonClassName="border-none outline-none"
            {...selectProps}
          />
        )}

        <OpenActionStatutDetailleModalButton action={action} statut={statut} />
      </div>
    </>
  );
};
