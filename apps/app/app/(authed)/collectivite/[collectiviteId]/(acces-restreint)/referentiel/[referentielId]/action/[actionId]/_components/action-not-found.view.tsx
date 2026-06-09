'use client';

import { makeReferentielUrl } from '@/app/app/paths';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { default as PictoMesure } from '@/app/ui/pictogrammes/mesure.picto.svg';
import { useCollectiviteId } from '@tet/api/collectivites';
import { EmptyCard } from '@tet/ui';

export const ActionNotFoundView = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  return (
    <EmptyCard
      dataTest="ActionNotFound"
      picto={(props) => <PictoMesure {...props} />}
      title="Action introuvable"
      description="Cette mesure n'existe pas dans votre référentiel ou le lien est obsolète."
      variant="transparent"
      actions={[
        {
          children: 'Retour au référentiel',
          href: makeReferentielUrl({ collectiviteId, referentielId }),
          variant: 'primary',
        },
      ]}
    />
  );
};
