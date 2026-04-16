import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
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
import { AxeIndicateursPanelContent } from './axe-indicateurs.panel-content';
import { useAxeContext } from './axe.context';

export const AxeMenuButton = () => {
  const { isReadOnly, setIsOpen, setIsOpenEditTitle, providerProps } =
    useAxeContext();

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

  const { setPanel } = useSidePanel();

  const openIndicateursPanel = () => {
    if (!isReadOnly) {
      setPanel({
        type: 'open',
        title: appLabels.associerIndicateurs,
        content: (
          <AxeIndicateursPanelContent
            collectiviteId={collectivite.collectiviteId}
            axe={axe}
            planId={rootAxe.id}
          />
        ),
      });
    }
  };

  if (isReadOnly) {
    return null;
  }

  const menuActions: MenuAction[] = [
    {
      label: appLabels.modifierTitre,
      icon: 'edit-line',
      onClick: () => {
        setIsOpenEditTitle(true);
      },
    },
    {
      label: appLabels.creerAxe,
      icon: 'folder-add-line',
      onClick: () => {
        setIsOpen(true);
        createAxe();
      },
    },
    {
      ...(isOptionEnabled(PlanDisplayOptionsEnum.DESCRIPTION)
        ? {}
        : {
            disabled: true,
            tooltip: appLabels.descriptionsMasquees,
          }),
      label: hasDescription
        ? appLabels.supprimerDescription
        : appLabels.ajouterDescription,
      icon: 'file-text-line',
      onClick: () => {
        setIsOpen(true);
        updateAxe({ ...axe, description: hasDescription ? null : '' });
      },
    },
    {
      ...(isOptionEnabled(PlanDisplayOptionsEnum.INDICATEURS)
        ? {}
        : {
            disabled: true,
            tooltip: appLabels.indicateursMasques,
          }),
      label: appLabels.lierIndicateur,
      icon: 'line-chart-line',
      onClick: () => {
        setIsOpen(true);
        openIndicateursPanel();
      },
    },
    {
      label: appLabels.deplacer,
      icon: 'drag-move-2-line',
      onClick: () => {
        setIsOpenMoveModal(true);
      },
    },
    {
      label: appLabels.supprimer,
      icon: 'delete-bin-6-line',
      onClick: () => {
        setIsOpenDeleteModal(true);
      },
    },
  ].filter((item) => item !== null);

  return (
    <>
      <ButtonMenu
        title={appLabels.editerAxe}
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
