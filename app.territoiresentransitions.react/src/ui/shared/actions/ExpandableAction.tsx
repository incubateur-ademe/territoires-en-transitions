import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { useActionSummaryChildren } from '@/app/core-logic/hooks/referentiel';
import ActionProgressBar from '@/app/ui/referentiels/ActionProgressBar';
import { ActionReferentielDisplayTitle } from '@/app/ui/referentiels/ActionReferentielDisplayTitle';
import { useEffect, useRef, useState } from 'react';
import { ReferentielCard } from '../../referentiels/Card/ReferentielCard';
import { Counter } from '../../score/Counter';

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

  const queryParameters = new URLSearchParams(window.location.search);
  const axeIdParam = queryParameters.get('axe');

  const [isOpen, setOpened] = useState(
    (action.type === 'axe' && action.id === axeIdParam) ||
      (action.type === 'sous-axe' &&
        !!axeIdParam &&
        action.id.includes(axeIdParam))
  );

  const children = useActionSummaryChildren(action as ActionDefinitionSummary);

  useEffect(() => {
    if (
      action.type === 'axe' &&
      action.id === axeIdParam &&
      ref &&
      ref.current
    ) {
      setTimeout(() => {
        ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 0);
    }
  }, [ref, axeIdParam]);

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
        children.map((action) => {
          if (action.type === 'axe' || action.type === 'sous-axe') {
            return (
              <div key={action.id} className="ml-4">
                <ExpandableAction
                  action={action}
                  isDescriptionOn={isDescriptionOn}
                />
              </div>
            );
          }
        })}
      {isOpen && children.some((action) => action.type === 'action') && (
        <div
          className={`ml-6 grid ${
            isDescriptionOn ? 'grid-cols-1' : 'grid-cols-3'
          } gap-4`}
        >
          {children
            .filter((action) => action.type === 'action')
            .map((action) => (
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
