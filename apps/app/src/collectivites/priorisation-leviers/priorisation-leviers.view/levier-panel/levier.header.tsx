import { appLabels } from '@/app/labels/catalog';
import { useRequestSidePanelClose } from '@/app/ui/layout/side-panel/side-panel.context';
import { Badge, Button } from '@tet/ui';
import { uiLabels } from '@tet/ui/labels/catalog';
import { JSX } from 'react';
import { LevierPriorisation } from '../data/to-leviers-priorisation';
import { UpsertPertinence } from '../data/use-upsert-pertinence';
import { PertinenceField } from './pertinence-field';

type LevierHeaderProps = {
  levier: LevierPriorisation;
  subtitle: string;
  upsertPertinence?: UpsertPertinence;
};

export const LevierHeader = ({
  levier,
  subtitle,
  upsertPertinence,
}: LevierHeaderProps): JSX.Element => {
  const requestClose = useRequestSidePanelClose();
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex items-start gap-2">
        <Button
          variant="unstyled"
          size="md"
          icon="arrow-left-double-line"
          aria-label={uiLabels.fermer}
          className="h-9 w-9 shrink-0 justify-center p-0 text-primary-8 hover:bg-primary-1"
          onClick={requestClose}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="mb-0 text-base font-bold text-primary-9">
            {levier.nom}
          </h2>
          <p className="mb-0 text-xs text-grey-6">{subtitle}</p>
        </div>
      </div>
      {levier.pertinence === 'non_pertinent' && (
        <div className="pl-11">
          <Badge
            title={appLabels.pertinenceLabel('non_pertinent')}
            variant="grey"
            size="sm"
            icon="eye-off-line"
            uppercase
            className="w-fit"
          />
        </div>
      )}
      <div className="pl-11">
        <PertinenceField
          levier={levier}
          pertinence={levier.pertinence}
          upsertPertinence={upsertPertinence}
        />
      </div>
    </div>
  );
};
