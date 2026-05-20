import { appLabels } from '@/app/labels/catalog';
import { ParcoursLabellisation } from '@tet/domain/referentiels';
import { Alert } from '@tet/ui';

export const MessageCompletudeECi = ({
  parcours,
}: {
  parcours: ParcoursLabellisation | null;
}) => {
  const { referentiel, etoiles } = parcours || {};

  return referentiel === 'eci' && etoiles !== 1 ? (
    <Alert
      state="warning"
      className="mb-8"
      description={
        <>
          <p>
            {appLabels.auditEciTachesAvecPreuves}{' '}
            <b>{appLabels.aucunAuditeurDossierIncomplet}</b>
          </p>
          <p>{appLabels.auditCoutAdemeRespectComplétude}</p>
        </>
      }
    />
  ) : null;
};
