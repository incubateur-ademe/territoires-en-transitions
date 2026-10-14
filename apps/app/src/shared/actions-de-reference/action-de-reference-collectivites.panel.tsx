import { appLabels } from '@/app/labels/catalog';
import { getTruncatedText } from '@/app/utils/formatUtils';
import type { ActionDeReferenceId } from '@tet/domain/shared';
import { Badge, Button, Icon, Notification } from '@tet/ui';
import { uniq } from 'es-toolkit';
import Link from 'next/link';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import {
  ActionDeReferenceExpandToggle,
  useExpandable,
} from './action-de-reference-expand.toggle';
import type {
  ActionDeReferenceFicheLiee,
  ActionDeReferenceFiches,
} from './actions-de-reference.contract';
import { useListFichesActionDeReference } from './data/use-list-fiches-action-de-reference';
import { toFicheLink } from './fiche-link.utils';

const DESCRIPTION_MAX_LENGTH = 150;

const countDistinctCollectivites = (
  fiches: readonly ActionDeReferenceFicheLiee[]
): number => uniq(fiches.map(({ collectiviteId }) => collectiviteId)).length;

const CollectivitesIcon = (): JSX.Element => (
  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-1">
    <Icon icon="government-line" size="sm" />
  </span>
);

const FicheDescription = ({
  description,
}: {
  readonly description: string;
}): JSX.Element => {
  const { truncatedText, isTextTruncated } = getTruncatedText(
    description,
    DESCRIPTION_MAX_LENGTH
  );
  return (
    <p className="mb-0 whitespace-pre-line text-sm font-medium text-grey-8">
      {isTextTruncated ? truncatedText : description}
    </p>
  );
};

const FicheTitle = ({
  fiche,
}: {
  readonly fiche: ActionDeReferenceFicheLiee;
}): JSX.Element => {
  const href = toFicheLink(fiche);
  return (
    <h4 className="mb-0 text-sm font-bold leading-normal text-primary-9">
      {href === undefined ? (
        fiche.titre
      ) : (
        <Link href={href} className="hover:underline">
          {fiche.titre}
        </Link>
      )}
    </h4>
  );
};

const TreeConnector = ({
  isLast,
}: {
  readonly isLast: boolean;
}): JSX.Element => (
  <>
    <span
      aria-hidden="true"
      className="absolute -left-4 -top-3 h-11 w-4 rounded-bl-lg border-b-2 border-l-2 border-primary-7"
    />
    {!isLast && (
      <span
        aria-hidden="true"
        className="absolute -bottom-3 -left-4 top-6 w-0.5 bg-primary-7"
      />
    )}
  </>
);

const LinkedFicheCard = ({
  fiche,
  isLast,
}: {
  readonly fiche: ActionDeReferenceFicheLiee;
  readonly isLast: boolean;
}): JSX.Element => (
  <li className="relative">
    <TreeConnector isLast={isLast} />
    <article className="relative flex flex-col gap-2 rounded-lg border border-grey-3 bg-white p-3">
      {fiche.restreint && (
        <div
          className="absolute -top-3 left-5 flex items-center gap-1"
          title={appLabels.actionAccesRestreint}
        >
          <Notification icon="lock-fill" size="xs" classname="w-7 h-7" />
        </div>
      )}
      {fiche.collectiviteNom && (
        <Badge
          title={fiche.collectiviteNom}
          icon="government-line"
          iconPosition="left"
          size="sm"
          variant="high"
          type="solid"
          className="border-transparent"
          trim={false}
          uppercase
        />
      )}
      <div className="flex flex-col gap-1">
        <FicheTitle fiche={fiche} />
        {fiche.description && (
          <FicheDescription description={fiche.description} />
        )}
      </div>
    </article>
  </li>
);

const ActionDeReferenceCollectivitesDisclosure = ({
  fiches,
}: {
  readonly fiches: readonly ActionDeReferenceFicheLiee[];
}): JSX.Element => {
  const { isExpanded, toggle } = useExpandable();

  return (
    <div className="relative z-10 flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-lg border border-grey-3 bg-grey-1 p-3">
        <CollectivitesIcon />
        <p className="mb-0 flex-1 text-sm font-medium text-grey-8">
          {appLabels.actionDeReferenceCollectivitesLiees(
            countDistinctCollectivites(fiches)
          )}
        </p>
        <ActionDeReferenceExpandToggle
          isExpanded={isExpanded}
          collapsedLabel={appLabels.actionDeReferenceCollectivitesVoir}
          expandedLabel={appLabels.actionDeReferenceCollectivitesMasquer}
          onToggle={toggle}
        />
      </div>
      {isExpanded && (
        <>
          <ul
            role="list"
            className="m-0 flex list-none flex-col gap-3 p-0 pt-3 pl-7"
          >
            {fiches.map((fiche, index) => (
              <LinkedFicheCard
                key={fiche.id}
                fiche={fiche}
                isLast={index === fiches.length - 1}
              />
            ))}
          </ul>
          <Button
            variant="link"
            size="sm"
            icon="arrow-up-s-line"
            iconPosition="right"
            className="self-start"
            onClick={toggle}
          >
            {appLabels.actionDeReferenceCollectivitesReplier}
          </Button>
        </>
      )}
    </div>
  );
};

const ActionDeReferenceCollectivitesError = ({
  onRetry,
}: {
  readonly onRetry: () => void;
}): JSX.Element => (
  <div className="relative z-10 flex items-center gap-3 rounded-lg border border-grey-3 p-3">
    <p className="mb-0 flex-1 text-sm font-medium text-error-1">
      {appLabels.actionDeReferenceCollectivitesErreur}
    </p>
    <Button variant="link" size="sm" onClick={onRetry}>
      {appLabels.reessayer}
    </Button>
  </div>
);

export const ActionDeReferenceCollectivitesView = ({
  fichesList,
}: {
  readonly fichesList: ActionDeReferenceFiches;
}): JSX.Element | null =>
  match(fichesList)
    .with({ status: 'loading' }, () => null)
    .with({ status: 'error' }, ({ retry }) => (
      <ActionDeReferenceCollectivitesError onRetry={retry} />
    ))
    .with({ status: 'loaded', fiches: [] }, () => null)
    .with({ status: 'loaded' }, ({ fiches }) => (
      <ActionDeReferenceCollectivitesDisclosure fiches={fiches} />
    ))
    .exhaustive();

export const ActionDeReferenceCollectivitesPanel = ({
  actionDeReferenceId,
}: {
  readonly actionDeReferenceId: ActionDeReferenceId;
}): JSX.Element | null => {
  const fichesList = useListFichesActionDeReference(actionDeReferenceId);
  return <ActionDeReferenceCollectivitesView fichesList={fichesList} />;
};
