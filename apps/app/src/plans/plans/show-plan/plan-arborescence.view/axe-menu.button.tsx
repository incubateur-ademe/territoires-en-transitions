import { PlanNode } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { ButtonMenu, MenuAction } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { checkAxeHasFiche } from '../../utils';
import { DeletePlanOrAxeModal } from '../actions/delete-axe-or-plan.modal';
import { useCreateAxe } from '../data/use-create-axe';
import { useUpdateAxe } from '../data/use-update-axe';

type Props = {
  axe: PlanNode;
  rootAxe: PlanNode;
  axes: PlanNode[];
  collectivite: CollectiviteAccess;
  axeOpenState: OpenState;
  indicateursPanelOpenState: OpenState;
};

export const AxeMenuButton = (props: Props) => {
  const {
    axe,
    axes,
    axeOpenState,
    collectivite,
    rootAxe,
    indicateursPanelOpenState,
  } = props;
  const hasDescription = axe.description !== null;

  const { mutateAsync: createAxe } = useCreateAxe({
    collectiviteId: collectivite.collectiviteId,
    planId: rootAxe.id,
    parentAxe: axe,
  });
  const { mutateAsync: updateAxe } = useUpdateAxe({
    axe,
    collectiviteId: collectivite.collectiviteId,
  });
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);

  const menuActions: MenuAction[] = [
    {
      label: 'Lier un indicateur',
      icon: 'line-chart-line',
      onClick: () => {
        axeOpenState.setIsOpen(true);
        indicateursPanelOpenState.setIsOpen(true);
      },
    },
    {
      label: hasDescription
        ? 'Supprimer la description'
        : 'Ajouter une description',
      icon: 'file-text-line',
      onClick: () => {
        axeOpenState.setIsOpen(true);
        updateAxe({ ...axe, description: hasDescription ? null : '' });
      },
    },
    {
      label: 'Créer un axe',
      icon: 'folder-add-line',
      onClick: () => {
        axeOpenState.setIsOpen(true);
        createAxe();
      },
    },
    /*{
      label: 'Déplacer',
      icon: 'drag-move-2-line',
      onClick: () => {},
    },*/
    {
      label: 'Supprimer',
      icon: 'delete-bin-2-line',
      onClick: () => {
        setIsOpenDeleteModal(true);
      },
    },
  ];

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
    </>
  );
};
