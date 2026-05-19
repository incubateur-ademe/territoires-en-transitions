import { StartAuditButton } from '@/app/referentiels/labellisations/start-audit/start-audit.button';
import { referentielIdEnumSchema } from '@tet/domain/referentiels';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string; referentielId: string }>;
}) {
  // page provisoire : visible en développement et en CI (pour les tests e2e),
  // masquée en production tant que la refonte n'est pas terminée
  const isDevOrCi =
    process.env.NODE_ENV === 'development' || process.env.CI === 'true';
  if (!isDevOrCi) {
    return null;
  }
  const { referentielId: unsafeReferentielId } = await params;
  const referentielId = referentielIdEnumSchema.parse(unsafeReferentielId);

  return (
    <div className="p-8">
      <StartAuditButton referentielId={referentielId} />
    </div>
  );
}
