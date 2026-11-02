import { JSX, RefCallback, useCallback } from 'react';
import { LevierPriorisation } from '../data/to-leviers-priorisation';
import { UpsertPertinence } from '../data/use-upsert-pertinence';
import { PertinenceField } from './pertinence-field';

type LevierHeaderProps = {
  levier: LevierPriorisation;
  subtitle: string;
  upsertPertinence?: UpsertPertinence;
  headerRef?: RefCallback<HTMLElement>;
};

const toEnclosingSidePanelHeader = (
  levierHeader: HTMLDivElement | null
): HTMLElement | null => levierHeader?.parentElement ?? null;

export const LevierHeader = ({
  levier,
  subtitle,
  upsertPertinence,
  headerRef,
}: LevierHeaderProps): JSX.Element => {
  const registerEnclosingSidePanelHeader = useCallback<
    RefCallback<HTMLDivElement>
  >(
    (levierHeader) => headerRef?.(toEnclosingSidePanelHeader(levierHeader)),
    [headerRef]
  );

  return (
    <div
      ref={registerEnclosingSidePanelHeader}
      className="flex flex-col gap-3 pt-3"
    >
      <p className="mb-0 text-xs text-grey-8">{subtitle}</p>
      {upsertPertinence !== undefined && (
        <PertinenceField
          levier={levier}
          pertinence={levier.pertinence}
          upsertPertinence={upsertPertinence}
        />
      )}
    </div>
  );
};
