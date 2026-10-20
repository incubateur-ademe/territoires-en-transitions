import { FicheWithRelations } from '@tet/domain/plans';
import { PageHeader } from '@tet/ui';
import { JSX } from 'react';
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
    <PageHeader.MetadataRow>
      <Pilotes personnes={pilotes ?? []} />
      <Separator />
      <Status status={fiche.statut} />
      <Separator />
      <Priority priority={fiche.priorite} />
      <Separator />
      {completion ? <CompletionStatus completion={completion} /> : null}
      <AccessManagementBadges fiche={fiche} collectiviteId={collectiviteId} />
    </PageHeader.MetadataRow>
  );
};
