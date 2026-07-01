import { appLabels } from '@/app/labels/catalog';
import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import {
  isNewReferentiel as isNewReferentielUtils,
  referentielIdEnumSchema,
} from '@tet/domain/referentiels';
import { Alert } from '@tet/ui';
import { ReactNode } from 'react';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string; referentielId: string }>;
}) {
  const { referentielId: unsafeReferentielId } = await params;
  const referentielId = referentielIdEnumSchema.parse(unsafeReferentielId);

  const isNewReferentiel = isNewReferentielUtils(referentielId);

  return (
    <ReferentielProvider referentielId={referentielId}>
      {isNewReferentiel && (
        <Alert className="mb-8" title={appLabels.bannerNouveauReferentiel} />
      )}
      {children}
    </ReferentielProvider>
  );
}
