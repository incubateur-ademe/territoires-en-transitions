import { makeCollectiviteActionDeReferenceUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@tet/api/collectivites';
import type { ActionDeReference } from '@tet/domain/shared';
import Link from 'next/link';
import type { JSX } from 'react';

export const ActionDeReferenceDetailLink = ({
  action,
}: {
  readonly action: Pick<ActionDeReference, 'id' | 'titre'>;
}): JSX.Element => {
  const collectiviteId = useCollectiviteId();
  return (
    <Link
      href={makeCollectiviteActionDeReferenceUrl({
        collectiviteId,
        actionDeReferenceId: action.id,
      })}
      className="bg-none text-inherit before:absolute before:inset-0 before:rounded-lg after:hidden hover:underline focus-visible:outline-none focus-visible:before:outline focus-visible:before:outline-2 focus-visible:before:outline-offset-2 focus-visible:before:outline-primary-7"
    >
      {action.titre}
    </Link>
  );
};
