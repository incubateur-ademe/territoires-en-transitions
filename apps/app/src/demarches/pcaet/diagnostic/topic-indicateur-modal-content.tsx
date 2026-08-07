'use client';

import DonneesIndicateur from '@/app/app/pages/collectivite/Indicateurs/detail/DonneesIndicateur';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { useGetIndicateur } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Alert, Button, cn } from '@tet/ui';
import type { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';

type Props = {
  collectiviteId: number;
  indicateurIdentifiantReferentiel: string;
  topicLabel: string;
  isReadonly?: boolean;
};

const TopicIndicateurDonnees = ({
  definition,
  collectiviteId,
  topicLabel,
  isReadonly,
}: {
  definition: IndicateurDefinition;
  collectiviteId: number;
  topicLabel: string;
  isReadonly?: boolean;
}) => {
  const { mutate: updateIndicateur } = useUpdateIndicateur(definition.id);

  const indicateurUrl = makeCollectiviteIndicateursUrl({
    collectiviteId,
    identifiantReferentiel: definition.identifiantReferentiel ?? undefined,
    indicateurId: definition.id,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-grey-7 m-0">{topicLabel}</p>
          <h3 className="text-lg font-bold text-primary-9 m-0 mt-1">
            {definition.titre}
          </h3>
        </div>
        <Button
          variant="outlined"
          size="sm"
          href={indicateurUrl}
          data-test="demarche-topic-indicateur-page-complete"
        >
          {appLabels.demarcheTopicIndicateurOuvrirFiche}
        </Button>
      </div>

      <div className={cn(isReadonly && 'pointer-events-none opacity-75')}>
        <DonneesIndicateur
          definition={definition}
          updateUnite={(value) => updateIndicateur({ unite: value })}
          updateCommentaire={(value) =>
            updateIndicateur({ commentaire: value })
          }
        />
      </div>
    </div>
  );
};

export const TopicIndicateurModalContent = ({
  collectiviteId,
  indicateurIdentifiantReferentiel,
  topicLabel,
  isReadonly,
}: Props) => {
  const { data: definition, isLoading, error } = useGetIndicateur(
    indicateurIdentifiantReferentiel,
    collectiviteId
  );

  if (isLoading) {
    return <SpinnerLoader className="m-auto" />;
  }

  if (error || !definition) {
    return (
      <Alert
        state="warning"
        title={appLabels.demarcheTopicIndicateurIntrouvableTitre}
        description={appLabels.demarcheTopicIndicateurIntrouvableDescription(
          {
            topicLabel,
            identifiant: indicateurIdentifiantReferentiel,
          }
        )}
      />
    );
  }

  if (isReadonly) {
    return (
      <div className="flex flex-col gap-4">
        <Alert
          state="info"
          title={appLabels.demarcheTopicIndicateurReadonlyTitre}
          description={appLabels.demarcheTopicIndicateurReadonlyDescription}
        />
        <TopicIndicateurDonnees
          definition={definition}
          collectiviteId={collectiviteId}
          topicLabel={topicLabel}
          isReadonly
        />
      </div>
    );
  }

  return (
    <TopicIndicateurDonnees
      definition={definition}
      collectiviteId={collectiviteId}
      topicLabel={topicLabel}
    />
  );
};
