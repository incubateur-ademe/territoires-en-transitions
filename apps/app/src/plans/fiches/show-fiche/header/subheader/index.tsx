import { FicheWithRelations } from '@tet/domain/plans';
import { CompletionStatus } from '../../components/completion.badge';
import { AccessManagementBadges } from './access-management.badges';
import { Pilotes } from './pilotes';
import { Priority } from './priority';
import { Status } from './status';

const Separator = () => {
  return <div className="w-[1px] h-5 bg-grey-5" />;
};

export const SubHeader = ({
  fiche,
  collectiviteId,
}: {
  fiche: FicheWithRelations;
  collectiviteId: number;
}): JSX.Element => {
  const { completion, pilotes } = fiche;
  return (
    <div className="flex gap-4 items-center">
      <Pilotes personnes={pilotes ?? []} />
      <Separator />

      <Status status={fiche.statut} />
      <Priority priority={fiche.priorite} />
      {completion ? <CompletionStatus completion={completion} /> : null}
      <AccessManagementBadges fiche={fiche} collectiviteId={collectiviteId} />
    </div>
  );
};
