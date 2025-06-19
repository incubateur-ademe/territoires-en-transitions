import { DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { CurrentCollectivite } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { useEditAxe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/useEditAxe';
import IconDrag from '@/app/ui/icons/IconDrag';
import { Button, Icon } from '@/ui';
import { useCreateFicheResume } from '../../FicheAction/data/useCreateFicheResume';
import { generateTitle } from '../../FicheAction/data/utils';
import SupprimerAxeModal from '../SupprimerAxeModal';
import { PlanNode } from '../data/types';
import { useAddAxe } from '../data/useUpsertAxe';
import { checkAxeHasFiche, childrenOfPlanNodes } from '../data/utils';
import AxeSkeleton from './AxeSkeleton';
import { AxeTitre } from './AxeTitre';
import Fiches from './Fiches';

export type AxeDndData = {
  type: 'axe';
  axe: PlanNode;
};

type Props = {
  axe: PlanNode;
  plan: PlanNode;
  axes: PlanNode[];
  isReadonly: boolean;
  collectivite: CurrentCollectivite;
};

const Axe = ({ plan, axe, axes, isReadonly, collectivite }: Props) => {
  const canDrag =
    collectivite?.niveauAcces === 'admin' ||
    collectivite?.niveauAcces === 'edition';

  const uniqueId = `axe-${axe.id}`;

  const { mutate: addAxe } = useAddAxe(axe.id, axe.depth, plan.id);

  const { mutate: createFicheResume } = useCreateFicheResume({
    collectiviteId: collectivite.collectiviteId,
    axeId: axe.id,
    planId: plan.id,
    axeFichesIds: axe.fiches,
  });

  const { mutate: updatePlan } = useEditAxe(plan.id);

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

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    isOver && active?.id !== over?.id && setIsOpen(true);
  }, [isOver]);

  if (axe.id < 0) {
    return <AxeSkeleton />;
  }
  const type = axe.depth >= 2 ? 'sousAxe' : 'axe';
  const fontColor = type === 'sousAxe' ? 'text-slate-400' : 'text-primary-8';

  return (
    <div
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
                  className={classNames('mr-2', fontColor)}
                />
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
          { group: !isOver },
          { 'bg-bf925': isDroppable }
        )}
      >
        <div className="flex items-start">
          {/** Drag handle */}
          {canDrag && !isDragging && (
            <div className="absolute top-0 -left-10 w-10 h-16 flex">
              <button
                ref={draggableRef}
                title="Déplacer"
                className={classNames('my-auto p-1 cursor-grab', {
                  'hidden group-hover:block': !isDragging,
                  'hover:!bg-none': isDragging,
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
                  className={fontColor}
                />
              </button>
            </div>
          </div>
          <AxeTitre
            axe={axe}
            planActionId={plan.id}
            isOpen={isOpen}
            isReadonly={isReadonly}
            onEdit={(nom) => {
              updatePlan({ ...axe, nom, type: null });
            }}
            fontColor={fontColor}
          />
          {!isReadonly && (
            <div className="invisible group-hover:visible flex items-center gap-3 mt-1 ml-3">
              <Button
                icon="file-add-line"
                variant="grey"
                size="xs"
                title="Créer une fiche"
                onClick={() => {
                  setIsOpen(true);
                  createFicheResume();
                }}
              />
              <Button
                icon="folder-add-line"
                variant="grey"
                size="xs"
                title="Créer un sous-titre"
                onClick={() => {
                  setIsOpen(true);
                  addAxe({
                    collectivite_id: collectivite.collectiviteId,
                    parent: axe.id,
                  });
                }}
              />
              <SupprimerAxeModal
                planId={plan.id}
                axe={axe}
                axeHasFiche={checkAxeHasFiche(axe, axes)}
              >
                <Button
                  dataTest="SupprimerAxeBouton"
                  icon="delete-bin-line"
                  variant="grey"
                  size="xs"
                  title="Supprimer ce titre"
                />
              </SupprimerAxeModal>
            </div>
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
          {axe.fiches && axe.fiches.length > 0 && (
            <Fiches
              collectivite={collectivite}
              isDndActive={active !== null}
              ficheIds={axe.fiches}
              planId={plan.id}
              axeId={axe.id}
            />
          )}
          {childrenOfPlanNodes(axe, axes).map((axe: PlanNode) => (
            <Axe
              key={axe.id}
              plan={plan}
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
                Cet axe ne contient aucune fiche ni sous-axe
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Axe;
