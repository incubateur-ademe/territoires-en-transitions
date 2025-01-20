import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { referentielId } from '@/app/utils/actions';
import Link from 'next/link';
import { Card } from '../../../../../packages/ui/src';
import { makeCollectiviteActionUrl } from '../../../app/paths';
import { Counter } from '../../score/Counter';
import ActionProgressBar from '../ActionProgressBar';

/**
 * Used on referentiels page, links to action page.
 */
type ReferentielCardProps = {
  action: ActionDefinitionSummary;
  isDescriptionOn: boolean;
};

export const ReferentielCard = ({
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
      href={makeCollectiviteActionUrl({
        collectiviteId: collectiviteId!,
        referentielId: referentiel,
        actionId: action.id,
      })}
    >
      <Card
        className="h-full !p-y-2 !p-x-4"
        // *** For future use ***
        // header={
        //   <div className="flex items-center gap-3">
        //     <Badge state="standard" title="Compétence 1" size="sm" />
        //   </div>
        // }
        // footer={
        //   <div className="flex flex-col">
        //     <ReferentielCardFooter pilotes={FAKE_pilotes} />
        //   </div>
        // }
      >
        <div className={`flex min-w-min ${!isDescriptionOn && 'min-h-36'}`}>
          <span className="text-lg font-bold text-primary-9 font-bold">
            {action.identifiant} {action.nom}
          </span>
        </div>

        <div>
          {isDescriptionOn && action.description && (
            <p
              className="htmlContent text-sm text-grey-9 font-light mb-6"
              dangerouslySetInnerHTML={{
                __html: action.description,
              }}
            />
          )}
          <Counter actionId={action.id} className={'mb-3'} />
          <ActionProgressBar
            action={action}
            progressBarStyleOptions={{ justify: 'start', fullWidth: true }}
          />
        </div>
      </Card>
    </Link>
  );
};
