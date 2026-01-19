import { ButtonMenu, MenuAction } from '@tet/ui';
import { useState } from 'react';
import { checkAxeHasFiche } from '../../../utils';
import { DeletePlanOrAxeModal } from '../../actions/delete-axe-or-plan.modal';
import { MoveAxeModal } from '../../actions/move-axe.modal';
import { useCreateAxe } from '../../data/use-create-axe';
import { useUpdateAxe } from '../../data/use-update-axe';
import {
  PlanDisplayOptionsEnum,
  usePlanOptions,
} from '../plan-options.context';
import { useAxeContext } from './axe.context';

export const AxeMenuButton = () => {
  const {
    isReadOnly,
    setIsOpen,
    setIsOpenPanelIndicateurs,
    setIsOpenEditTitle,
    providerProps,
  } = useAxeContext();
  const { axe, axes, rootAxe, collectivite } = providerProps;
  const hasDescription = axe.description !== null;

  const { isOptionEnabled } = usePlanOptions();

  const { mutateAsync: createAxe } = useCreateAxe({
    collectiviteId: collectivite.collectiviteId,
    planId: rootAxe.id,
    parentAxe: axe,
  });
  const { mutateAsync: updateAxe } = useUpdateAxe({
    axe,
    collectiviteId: collectivite.collectiviteId,
    planId: rootAxe.id,
  });
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [isOpenMoveModal, setIsOpenMoveModal] = useState(false);

  if (isReadOnly) {
    return null;
  }

  const menuActions: MenuAction[] = [
    isOptionEnabled(PlanDisplayOptionsEnum.INDICATEURS)
      ? {
        label: 'Lier un indicateur',
        icon: 'line-chart-line',
        onClick: () => {
          setIsOpen(true);
          setIsOpenPanelIndicateurs(true);
        },
      }
      : null,
    isOptionEnabled(PlanDisplayOptionsEnum.DESCRIPTION)
      ? {
        label: hasDescription
          ? 'Supprimer la description'
          : 'Ajouter une description',
        icon: 'file-text-line',
        onClick: () => {
          setIsOpen(true);
          updateAxe({ ...axe, description: hasDescription ? null : '' });
        },
      }
      : null,
    {
      label: 'Modifier le titre',
      icon: 'edit-line',
      onClick: () => {
        setIsOpenEditTitle(true);
      },
    },
    {
      label: 'Créer un axe',
      icon: 'folder-add-line',
      onClick: () => {
        setIsOpen(true);
        createAxe();
      },
    },
    {
      label: 'Déplacer',
      icon: 'drag-move-2-line',
      onClick: () => {
        setIsOpenMoveModal(true);
      },
    },
    {
      label: 'Supprimer',
      icon: 'delete-bin-2-line',
      onClick: () => {
        setIsOpenDeleteModal(true);
      },
    },
  ].filter((item) => item !== null);

  return (
    <>
      <ButtonMenu
        title="Editer cet axe"
        icon="more-line"
        variant="grey"
        size="xs"
        menu={{
          actions: menuActions,
        }}
      />
      <DeletePlanOrAxeModal
        planId={rootAxe.id}
        axeId={axe.id}
        axeHasFiche={checkAxeHasFiche(axe, axes)}
        openState={{
          isOpen: isOpenDeleteModal,
          setIsOpen: setIsOpenDeleteModal,
        }}
      />
      <MoveAxeModal
        collectiviteId={collectivite.collectiviteId}
        axe={axe}
        rootAxe={rootAxe}
        axes={axes}
        openState={{
          isOpen: isOpenMoveModal,
          setIsOpen: setIsOpenMoveModal,
        }}
      />
    </>
  );
};
