import { DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useToggleAxe } from '@/app/plans/plans/show-plan/plan-arborescence.view/use-toggle-axe';
import IconDrag from '@/app/ui/icons/IconDrag';
import { useIntersectionObserver } from '@/app/utils/useIntersectionObserver';
import { PlanNode } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { Button, Icon, RichTextEditor, RichTextView } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useCreateFicheResume } from '../../../../app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
import { childrenOfPlanNodes } from '../../utils';
import { useAxeIndicateurs } from '../data/use-axe-indicateurs';
import { useUpdateAxe } from '../data/use-update-axe';
import { AxeIndicateursList } from './axe-indicateurs-list';
import { AxeIndicateursPanel } from './axe-indicateurs-panel';
import { AxeMenuButton } from './axe-menu.button';
import { AxeSkeleton } from './axe-skeleton';
import { AxeTitleInput } from './axe-title.input';
import { FichesList } from './fiches.list';
import { PlanDisplayOptionsEnum, usePlanOptions } from './plan-options.context';

export type AxeDndData = {
  type: 'axe';
  axe: PlanNode;
};

type Props = {
  axe: PlanNode;
  rootAxe: PlanNode;
  axes: PlanNode[];
  isReadonly: boolean;
  collectivite: CollectiviteAccess;
};

export const DraggableAxe = (props: Props) => {
  const { rootAxe, axe, axes, isReadonly, collectivite } = props;
  const canDrag =
    collectivite?.niveauAcces === 'admin' ||
    collectivite?.niveauAcces === 'edition';

  const uniqueId = `axe-${axe.id}`;
  const axeRef = useRef<HTMLDivElement>(null);

  const collectiviteId = collectivite.collectiviteId;
  const { mutate: createFicheResume } = useCreateFicheResume({
    collectiviteId,
    axeId: axe.id,
    planId: rootAxe.id,
    axeFichesIds: axe.fiches,
  });

  const { mutateAsync: updateAxe } = useUpdateAxe({
    axe,
    collectiviteId,
  });

  const {
    isOver,
    active,
    over,
    setNodeRef: droppableRef,
  } = useDroppable({
    id: uniqueId,
    data: {
      type: 'axe',
      axe,
    } as AxeDndData,
  });

  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
  } = useDraggable({
    id: uniqueId,
    data: {
      type: 'axe',
      axe,
    } as AxeDndData,
    disabled: !canDrag,
  });

  const activeData = active?.data.current;
  const overData = over?.data.current;

  const isDragging =
    activeData?.type === 'axe' && activeData?.axe?.id === axe.id;

  const isDroppable =
    isOver &&
    ((activeData?.type === 'axe' &&
      activeData?.axe.id !== axe.id &&
      activeData.axe.parent !== axe.id &&
      overData?.axe.id === axe.id) ||
      (activeData?.type === 'fiche' && activeData.axeId !== axe.id));

  const { isOpen, setIsOpen, shouldScroll } = useToggleAxe(axe.id, axes);

  const { ref: intersectionRef, entry } = useIntersectionObserver();
  const { selectedIndicateurs, toggleIndicateur } = useAxeIndicateurs({
    axe,
    collectiviteId,
    enabled: (isOpen && entry?.isIntersecting) || false,
  });

  const { isOptionEnabled } = usePlanOptions();

  const [isOpenPanelIndicateurs, setIsOpenPanelIndicateurs] = useState(false);
  const indicateursPanelOpenState = {
    isOpen: isOpenPanelIndicateurs,
    setIsOpen: setIsOpenPanelIndicateurs,
  };

  useEffect(() => {
    isOver && active?.id !== over?.id && setIsOpen(true);
  }, [active?.id, isOver, over?.id, setIsOpen]);

  useEffect(() => {
    if (axeRef.current && shouldScroll) {
      axeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [axeRef, shouldScroll]);

  if (axe.id < 0) {
    return <AxeSkeleton />;
  }
  const axeFontColor = 'text-primary-8';
  return (
    <div
      ref={axeRef}
      data-test="Axe"
      id={`axe-${axe.id}`}
      className="relative flex flex-col"
    >
      {/** Drag overlay */}
      {isDragging &&
        createPortal(
          <DragOverlay dropAnimation={null}>
            <div className="opacity-80 cursor-grabbing">
              <div className="flex items-start w-[30rem] ml-4 p-2 rounded bg-white border border-gray-200">
                <Icon
                  icon="arrow-right-s-line"
                  size="lg"
                  className={classNames('mr-2', axeFontColor)}
                />
                {axe.nom || 'Sans titre'}
              </div>
            </div>
          </DragOverlay>,
          document.body
        )}
      {/** Header */}
      <div
        ref={droppableRef}
        className={classNames(
          'relative py-3 pr-4 pl-2',
          { group: !isOver },
          { 'bg-bf925': isDroppable }
        )}
      >
        <div className="flex items-start" ref={intersectionRef}>
          {/** Drag handle */}
          {canDrag && !isDragging && (
            <div className="absolute top-0 -left-10 w-10 h-16 flex">
              <button
                ref={draggableRef}
                title="Déplacer"
                className={cn('my-auto p-1 cursor-grab', {
                  'hidden group-hover:block': !isDragging,
                  'hover:bg-transparent': isDragging,
                })}
                {...listeners}
                {...attributes}
              >
                {!isDragging && <IconDrag />}
              </button>
            </div>
          )}
          <div className="-mt-0.5 pt-2">
            <div className="flex mr-3 group-hover:outline group-hover:outline-gray-100">
              <button
                data-test="BoutonDeplierAxe"
                className={classNames('p-0.5 text-primary', {
                  'rotate-90': isOpen && !isDragging,
                })}
                onClick={() => setIsOpen(!isOpen)}
              >
                <Icon
                  icon="arrow-right-s-line"
                  size="lg"
                  className={axeFontColor}
                />
              </button>
            </div>
          </div>
          <AxeTitleInput
            axe={axe}
            planActionId={rootAxe.id}
            isOpen={isOpen}
            isReadonly={isReadonly}
            onEdit={(nom) => {
              updateAxe({ nom });
            }}
            fontColor={axeFontColor}
          />
          {!isReadonly && (
            <>
              <div className="invisible group-hover:visible flex items-center gap-3 ml-3 min-w-max">
                <Button
                  variant="grey"
                  size="xs"
                  title="Créer une action"
                  onClick={() => {
                    setIsOpen(true);
                    createFicheResume();
                  }}
                >
                  Créer une action
                </Button>
                <AxeMenuButton
                  {...props}
                  axeOpenState={{ isOpen, setIsOpen }}
                  indicateursPanelOpenState={indicateursPanelOpenState}
                />
              </div>
              <AxeIndicateursPanel
                {...props}
                openState={indicateursPanelOpenState}
              />
            </>
          )}
        </div>
        {isDroppable && (
          <span className="block mt-2 mb-2 mx-12 p-4 text-sm text-indigo-400 rounded-md border border-dashed border-primary">
            Déplacer dans cet axe
          </span>
        )}
      </div>
      {/** Fiches et sous-axes */}
      {!isDragging && isOpen && (
        <div className="flex flex-col ml-12">
          {axe.description !== null &&
            isOptionEnabled(PlanDisplayOptionsEnum.DESCRIPTION) && (
              <>
                <p className="text-grey-8 text-sm mt-4 mb-2">
                  <Icon icon="file-text-line" className="mr-2" />
                  Description
                </p>
                {isReadonly ? (
                  axe.description ? (
                    <RichTextView content={axe.description} />
                  ) : null
                ) : (
                  <RichTextEditor
                    id={`axe-desc-${axe.id}`}
                    className="border-0 focus-within:border"
                    initialValue={axe.description}
                    onChange={(value) => updateAxe({ description: value })}
                  />
                )}
              </>
            )}
          {isOptionEnabled(PlanDisplayOptionsEnum.INDICATEURS) &&
            selectedIndicateurs?.length > 0 && (
              <>
                <p className="text-grey-8 text-sm mt-4 mb-2">
                  <Icon icon="link" className="mr-2" />
                  Indicateurs liés
                </p>
                <AxeIndicateursList
                  indicateurs={selectedIndicateurs}
                  isEditable={!isReadonly}
                  isReadonly={isReadonly}
                  hideChart={
                    !isOptionEnabled(
                      PlanDisplayOptionsEnum.GRAPHIQUE_INDICATEURS
                    )
                  }
                  onToggleSelection={(indicateur) =>
                    toggleIndicateur(indicateur)
                  }
                  collectiviteId={collectiviteId}
                />
              </>
            )}
          {axe.fiches?.length > 0 &&
            isOptionEnabled(PlanDisplayOptionsEnum.ACTIONS) && (
              <>
                <p className="text-grey-8 text-sm mt-4 mb-2">
                  <Icon icon="file-line" className="mr-2" />
                  Actions
                </p>
                <FichesList
                  collectivite={collectivite}
                  isDndActive={active !== null}
                  ficheIds={axe.fiches}
                  axeId={axe.id}
                />
              </>
            )}
          {childrenOfPlanNodes(axe, axes).map((axe: PlanNode) => (
            <DraggableAxe
              key={axe.id}
              rootAxe={rootAxe}
              axe={axe}
              axes={axes}
              isReadonly={isReadonly}
              collectivite={collectivite}
            />
          ))}
          {/** Empty state */}
          {(!axe.fiches || axe.fiches.length === 0) &&
            childrenOfPlanNodes(axe, axes).length === 0 &&
            !isOver && (
              <div className="mb-4 px-2 text-sm italic text-gray-400">
                Cet axe ne contient aucune action ni sous-axe
              </div>
            )}
        </div>
      )}
    </div>
  );
};
