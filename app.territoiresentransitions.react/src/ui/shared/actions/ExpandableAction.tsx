import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { useActionSummaryChildren } from '@/app/core-logic/hooks/referentiel';
import ActionProgressBar from '@/app/ui/referentiels/ActionProgressBar';
import { ActionReferentielDisplayTitle } from '@/app/ui/referentiels/ActionReferentielDisplayTitle';
import { useEffect, useRef, useState } from 'react';
import { ReferentielCard } from '../../referentiels/Card/ReferentielCard';
import { Counter } from '../../referentiels/Counter';

/**
 * An expandable action used for "axes" and "sous axes", shows Scores.
 *
 * Note: could be made recursive to simplify display on "axes" pages.
 */
export const ExpandableAction = ({
  action,
  isDescriptionOn,
}: {
  action: ActionDefinitionSummary;
  isDescriptionOn: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const axeIdParam = new URLSearchParams(window.location.search).get('axe');

  const isAxe = action.type === 'axe';
  const isSousAxe = action.type === 'sous-axe';

  const [isOpen, setOpened] = useState(
    (isAxe && action.id === axeIdParam) ||
      (isSousAxe && !!axeIdParam && action.id.includes(axeIdParam))
  );

  const children = useActionSummaryChildren(action as ActionDefinitionSummary);
  const expandableChildren = children.filter(
    (child) => child.type === 'axe' || child.type === 'sous-axe'
  );
  const actionChildren = children.filter((child) => child.type === 'action');

  useEffect(() => {
    if (isAxe && action.id === axeIdParam && ref?.current) {
      setTimeout(() => {
        ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 0);
    }
  }, [ref, axeIdParam, action.id, isAxe]);

  return (
    <section
      className="flex flex-col"
      data-test={`ExpandableAction-${action.identifiant}`}
    >
      <header
        className="w-full cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          setOpened(!isOpen);
        }}
      >
        <div className="flex flex-row items-center justify-between mt-5 mb-5">
          <div
            ref={ref}
            className="flex flex-row w-full justify-between items-center"
          >
            <ActionReferentielDisplayTitle action={action} isOpen={isOpen} />
            <div className="flex items-center">
              <div className="w-48 ml-6">
                <ActionProgressBar
                  action={action}
                  progressBarStyleOptions={{ fullWidth: true }}
                />
              </div>
              <div className="w-64 ml-6">
                <Counter actionId={action.id} className="justify-end" />
              </div>
            </div>
          </div>
        </div>
      </header>
      {isOpen &&
        expandableChildren.map((action) => (
          <div key={action.id} className="ml-4">
            <ExpandableAction
              action={action}
              isDescriptionOn={isDescriptionOn}
            />
          </div>
        ))}

      {isOpen && actionChildren.length > 0 && (
        <div
          className={`ml-6 grid ${
            isDescriptionOn ? 'grid-cols-1' : 'grid-cols-3'
          } gap-4 grid-rows-1`}
        >
          {actionChildren.map((action) => (
            <ReferentielCard
              key={action.id}
              action={action}
              isDescriptionOn={isDescriptionOn}
            />
          ))}
        </div>
      )}
    </section>
  );
};
