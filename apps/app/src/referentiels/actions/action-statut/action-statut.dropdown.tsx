import { avancementToLabel } from '@/app/app/labels';
import {
  ActionTypeEnum,
  StatutAvancement,
  StatutAvancementCreate,
  StatutAvancementEnum,
  isActionStatutDetaille,
} from '@tet/domain/referentiels';
import { BadgeSize, Select } from '@tet/ui';
import { ComponentProps, useState } from 'react';
import { ActionListItem } from '../use-list-actions';
import ActionStatutBadge from './action-statut.badge';
import { OpenActionStatutDetailleModal } from './open-action-statut-detaille.modal';

interface Props
  extends Omit<
    ComponentProps<typeof Select>,
    'values' | 'onChange' | 'options' | 'customItem'
  > {
  value?: StatutAvancement | null;
  onChange: (statut: StatutAvancementCreate) => void;
  badgeSize?: BadgeSize;
  action: ActionListItem;
  onStatutDetailleModalClose?: () => void;
  /**
   * Si `true`, sélectionner "détaillé à la tâche" n'ouvre plus la modale
   * dédiée — le caller doit alors gérer lui-même la sélection via `onChange`
   * (ex: déplier la ligne et focusser la 1re sous-tâche dans le tableau).
   * La modale "détaillé au pourcentage" reste, elle, toujours ouverte.
   */
  inlineDetailleALaTache?: boolean;
}

const statutAvancementsToSelectOptions = (items: StatutAvancementCreate[]) =>
  items.map((value) => ({ value, label: avancementToLabel[value] }));

export const ACTION_STATUT_SELECT_DEFAULT_OPTIONS =
  statutAvancementsToSelectOptions([
    StatutAvancementEnum.NON_RENSEIGNE,
    StatutAvancementEnum.FAIT,
    StatutAvancementEnum.PAS_FAIT,
    StatutAvancementEnum.PROGRAMME,
    StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
    StatutAvancementEnum.DETAILLE_A_LA_TACHE,
    StatutAvancementEnum.NON_CONCERNE,
  ]);

export const ActionStatutDropdown = (props: Props) => {
  const {
    value,
    onChange,
    openState,
    badgeSize,
    action,
    onStatutDetailleModalClose,
    inlineDetailleALaTache = false,
  } = props;

  const [selectedStatutDetaille, setSelectedStatutDetaille] = useState<Extract<
    StatutAvancement,
    'detaille_a_la_tache' | 'detaille'
  > | null>(null);

  if (value === StatutAvancementEnum.NON_RENSEIGNABLE) {
    return null;
  }

  const isSousActionHavingTasks =
    action.actionType === ActionTypeEnum.SOUS_ACTION &&
    action.childrenIds.length > 0;

  const options = isSousActionHavingTasks
    ? ACTION_STATUT_SELECT_DEFAULT_OPTIONS
    : ACTION_STATUT_SELECT_DEFAULT_OPTIONS.filter(
        (item) => item.value !== StatutAvancementEnum.DETAILLE_A_LA_TACHE
      );

  const currentValue = value ?? StatutAvancementEnum.NON_RENSEIGNE;

  const handleOnChange = (newStatut: StatutAvancementCreate | undefined) => {
    // => toujours une valeur sélectionnée
    const statut = !newStatut ? currentValue : newStatut;

    const shouldOpenDetailleModal =
      isActionStatutDetaille(statut) &&
      !(
        inlineDetailleALaTache &&
        statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE
      );

    setSelectedStatutDetaille(shouldOpenDetailleModal ? statut : null);
    onChange(statut);
  };

  return (
    <>
      <Select
        {...props}
        containerWidthMatchButton={false}
        dataTest="SelectStatut"
        values={currentValue}
        options={options}
        onChange={(v) => handleOnChange(v as StatutAvancementCreate)}
        openState={openState}
        customItem={(item) => (
          <ActionStatutBadge
            statut={item.value as StatutAvancementCreate}
            size={badgeSize}
          />
        )}
      />

      {selectedStatutDetaille !== null && (
        <OpenActionStatutDetailleModal
          action={action}
          statutToOpen={selectedStatutDetaille}
          onClose={() => {
            setSelectedStatutDetaille(null);
            onStatutDetailleModalClose?.();
          }}
        />
      )}
    </>
  );
};
