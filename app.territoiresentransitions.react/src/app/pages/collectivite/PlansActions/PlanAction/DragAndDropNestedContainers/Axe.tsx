import {createPortal} from 'react-dom';
import {useEffect, useState} from 'react';
import classNames from 'classnames';
import {DragOverlay, useDraggable, useDroppable} from '@dnd-kit/core';

import Fiches from './Fiches';
import AxeTitre from './AxeTitre';
import SupprimerAxeModal from '../SupprimerAxeModal';
import DragIcon from './DragIcon';
import {PlanNode} from '../data/types';
import {generateTitle} from '../../FicheAction/data/utils';

export type AxeDndData = {
  type: 'axe';
  axe: PlanNode;
};

type Props = {
  axe: PlanNode;
  plan: PlanNode;
  isAxePage: boolean;
  isReadonly: boolean;
};

const Axe = ({plan, axe, isAxePage, isReadonly}: Props) => {
  const uniqueId = `axe-${axe.id}`;

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
  });

  const activeData = active?.data.current;
  const overData = over?.data.current;

  const isDragging =
    activeData?.axe?.id === axe.id && activeData?.type === 'axe';

  const isDroppable =
    isOver &&
    ((activeData?.type === 'axe' &&
      active?.id !== over?.id &&
      activeData?.axe.ancestors &&
      activeData?.axe.ancestors[activeData?.axe.ancestors.length - 1] !==
        overData?.axe.id) ||
      (activeData?.type === 'fiche' && activeData?.axeId !== overData?.axe.id));

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    isOver && active?.id !== over?.id && setIsOpen(true);
  }, [isOver]);

  return (
    <div
      data-test="Axe"
      id={axe.id.toString()}
      className="relative flex flex-col"
    >
      {/** Drag overlay */}
      {isDragging &&
        createPortal(
          <DragOverlay dropAnimation={null}>
            <div className="opacity-80 cursor-grabbing">
              <div className="flex items-start w-[30rem] ml-4 p-2 rounded bg-white border border-gray-200">
                <div className="mr-2 fr-icon-arrow-right-s-fill text-bf500" />
                {generateTitle(axe.nom)}
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
          {group: !isOver},
          {'bg-bf925': isDroppable}
        )}
      >
        <div className="flex items-start">
          {/** Drag handle */}
          {!isDragging && (
            <div className="absolute top-0 -left-10 w-10 h-16 flex">
              <button
                ref={draggableRef}
                title="Déplacer"
                className={classNames('my-auto p-2', {
                  'hidden group-hover:block': !isDragging,
                  'hover:!bg-none': isDragging,
                })}
                {...listeners}
                {...attributes}
              >
                {!isDragging && <DragIcon />}
              </button>
            </div>
          )}
          <div className="-mt-0.5 pt-2">
            <div className="flex mr-3 group-hover:outline group-hover:outline-gray-100">
              <button
                data-test="BoutonDeplierAxe"
                className="p-0.5"
                onClick={() => setIsOpen(!isOpen)}
              >
                <div
                  className={classNames(
                    'h-6 fr-icon-arrow-right-s-fill text-bf500',
                    {
                      'rotate-90': isOpen && !isDragging,
                    }
                  )}
                />
              </button>
            </div>
          </div>
          <AxeTitre
            axe={axe}
            planActionId={plan.id}
            isOpen={isOpen}
            isReadonly={isReadonly}
          />
          {!isReadonly && (
            <SupprimerAxeModal axe={axe} plan={plan}>
              <div className="ml-3 -mt-1 pt-2">
                <button
                  data-test="SupprimerAxeBouton"
                  className="invisible group-hover:visible fr-btn fr-btn--tertiary fr-btn--sm fr-fi-delete-line"
                  title="Supprimer ce titre"
                />
              </div>
            </SupprimerAxeModal>
          )}
        </div>
        {isDroppable && (
          <span className="block mt-2 mb-2 mx-12 p-4 text-sm text-indigo-400 rounded-md border border-dashed border-bf525">
            Déplacer dans cet axe
          </span>
        )}
      </div>
      {/** Fiches et sous-axes */}
      {!isDragging && isOpen && (
        <div className="flex flex-col ml-12">
          {axe.fiches && axe.fiches.length > 0 && (
            <Fiches
              isDndActive={active !== null}
              isAxePage={isAxePage}
              ficheIds={axe.fiches}
              planId={plan.id}
              axeId={axe.id}
            />
          )}
          {axe.children.length > 0 &&
            axe.children.map((axe: PlanNode) => (
              <Axe
                key={axe.id}
                plan={plan}
                axe={axe}
                isAxePage={isAxePage}
                isReadonly={isReadonly}
              />
            ))}
          {/** Empty state */}
          {(!axe.fiches || axe.fiches.length === 0) &&
            axe.children.length === 0 &&
            !isOver && (
              <div className="mb-4 px-2 text-sm italic text-gray-400">
                Cet axe ne contient aucune fiche ni sous-axe
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Axe;
