'use client';

import { makeMaCollectiviteUrl } from '@/app/app/paths';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Alert, Button, ButtonVariant } from '@tet/ui';

export type ActionPersonnalisationInfoProps = {
  actionId: string;
  className?: string;
};

export const ActionPersonnalisationInfo = ({
  actionId,
  className,
}: ActionPersonnalisationInfoProps) => {
  const trpc = useTRPC();
  const collectiviteId = useCollectiviteId();

  const { data } = useQuery(
    trpc.referentiels.actions.getNeededPersonnalisationQuestionsStatus.queryOptions(
      { collectiviteId, actionId }
    )
  );

  if (!data || Object.keys(data.questionStatusById).length === 0) {
    return null;
  }

  const hasMissingResponses = (data?.missingNeededQuestionIds?.length ?? 0) > 0;

  const state = hasMissingResponses ? 'warning' : 'info';
  const description = `${
    hasMissingResponses
      ? 'Vous n’avez pas encore répondu aux questions de personnalisation pour votre collectivité. '
      : ''
  }Les réponses peuvent modifier les mesures à afficher et permettent ainsi de paramétrer le référentiel pour l’adapter aux compétences et caractéristiques de votre collectivité.`;
  const ctaLabel = hasMissingResponses
    ? 'Répondre aux questions'
    : 'Voir les questions';
  const ctaVariant: ButtonVariant = hasMissingResponses
    ? 'primary'
    : 'underlined';

  return (
    <Alert
      className={className}
      state={state}
      title={
        'Cette mesure est affectée par une ou des questions de personnalisation.'
      }
      description={description}
      footer={
        <Button
          className="mt-1"
          size="sm"
          variant={ctaVariant}
          href={makeMaCollectiviteUrl({
            collectiviteId,
            view: 'personnalisation',
            searchParams: { a: actionId },
          })}
        >
          {ctaLabel}
        </Button>
      }
    />
  );
};
