import { makeReferentielActionUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { Card } from '@/ui';
import Link from 'next/link';
import { ActionDefinitionSummary } from '../ActionDefinitionSummaryReadEndpoint';
import { referentielId } from '../actions.utils';
import ScoreProgressBar from '../scores/score.progress-bar';
import { ScoreRatioBadge } from '../scores/score.ratio-badge';

/**
 * Used on referentiels page, links to action page.
 */
type ReferentielCardProps = {
  action: ActionDefinitionSummary;
  isDescriptionOn: boolean;
};

export const ActionCard = ({
  action,
  isDescriptionOn,
}: ReferentielCardProps) => {
  const collectiviteId = useCollectiviteId();
  const referentiel = referentielId(action.id);

  // *** For future use ***
  // Replace with real data :)
  // const FAKE_pilotes = [
  //   {
  //     nom: 'John Doe',
  //     collectiviteId: collectiviteId!,
  //     tagId: 1,
  //     userId: '1',
  //   },
  // ];

  return (
    <Link
      href={makeReferentielActionUrl({
        collectiviteId: collectiviteId!,
        referentielId: referentiel,
        actionId: action.id,
      })}
    >
      <Card
        className="h-full !p-y-2 !p-x-4 flex flex-col"
        // *** For future use ***
        // header={
        //   <div className="flex items-center gap-3">
        //     <Badge state="standard" title="Compétence 1" size="sm" />
        //   </div>
        // }
        // footer={
        //   <div className="flex flex-col">
        //     <ActionCardFooter pilotes={FAKE_pilotes} />
        //   </div>
        // }
      >
        <div className="flex-grow">
          <div className="flex min-w-min">
            <span className="text-lg font-bold text-primary-9 font-bold">
              {action.identifiant} {action.nom}
            </span>
          </div>

          {isDescriptionOn && action.description && (
            <p
              className="htmlContent text-sm text-grey-9 font-light my-6"
              dangerouslySetInnerHTML={{
                __html: action.description,
              }}
            />
          )}
        </div>

        <div className="mt-auto">
          <ScoreRatioBadge actionId={action.id} className={'mb-3'} />
          <ScoreProgressBar
            actionDefinition={action}
            progressBarStyleOptions={{ fullWidth: true }}
          />
        </div>
      </Card>
    </Link>
  );
};
