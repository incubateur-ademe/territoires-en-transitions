import { appLabels } from '@/app/labels/catalog';
import { TAuditEnCours } from '@/app/referentiels/audits/types';
import { canUserUpdateAuditReport } from '@/app/referentiels/preuves/Bibliotheque/canUserUpdateAuditReport';
import CarteDocument from '@/app/referentiels/preuves/Bibliotheque/CarteDocument';
import { TPreuveAuditEtLabellisation } from '@/app/referentiels/preuves/Bibliotheque/types';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import {
  canUserUpdateCandidatureDocuments,
  Etoile,
  getParcoursLabellisationStatus,
} from '@tet/domain/referentiels';
import { UserRolesAndPermissions } from '@tet/domain/users';
import { Fragment } from 'react';
import { numLabels } from '../labellisations/numLabels';

/**
 * Affiche les documents d'audit et labellisation du référentiel courant,
 * groupés par demande de labellisation ou d'audit.
 */
export const PreuvesLabellisation = ({
  demandes,
}: {
  demandes: {
    id: string;
    docs: TPreuveAuditEtLabellisation[];
    info: TCycleInfo;
  }[];
}) => {
  return (
    <>
      {demandes.map(({ id, docs, info }, index) => (
        <DocsAuditOuLabellisation
          key={id}
          preuves={docs}
          info={info}
          className={index ? 'mt-6' : undefined}
        />
      ))}
    </>
  );
};

/**
 * Affiche le sous-ensemble des documents d'une demande de labellisation ou
 * d'audit.
 */
const DocsAuditOuLabellisation = (props: {
  className?: string;
  preuves: TPreuveAuditEtLabellisation[];
  info: TCycleInfo;
}) => {
  const { className, preuves, info } = props;

  return (
    <Fragment>
      <h3 className={className}>
        <Title info={info} />
      </h3>
      {preuves.map((preuve) => (
        <DocAuditOuLabellisation key={preuve.id} preuve={preuve} info={info} />
      ))}
    </Fragment>
  );
};

const DocAuditOuLabellisation = ({
  preuve,
  info,
}: {
  preuve: TPreuveAuditEtLabellisation;
  info: TCycleInfo;
}) => {
  const { hasCollectivitePermission, hasReferentielPermission } =
    useCurrentCollectivite();
  const user = useUser();

  const referentielId =
    preuve.demande?.referentiel ?? preuve.audit?.referentiel_id ?? null;

  const canMutateReferentiels = referentielId
    ? hasReferentielPermission('referentiels.mutate', referentielId)
    : hasCollectivitePermission('referentiels.mutate');

  const canUpdate = canUpdateAuditOrLabellisationPreuve({
    preuve,
    user,
    audit: info.audit,
    canMutateReferentiels,
  });

  return (
    <CarteDocument
      document={preuve}
      isReadonly={!canUpdate}
      classComment="pb-0 mb-2"
    />
  );
};

const canUpdateAuditOrLabellisationPreuve = ({
  preuve,
  user,
  audit,
  canMutateReferentiels,
}: {
  preuve: TPreuveAuditEtLabellisation;
  user: UserRolesAndPermissions;
  audit: TAuditEnCours | null;
  canMutateReferentiels: boolean;
}): boolean => {
  if (preuve.preuve_type === 'audit') {
    return canUserUpdateAuditReport(user, preuve);
  }
  return canUserUpdateCandidatureDocuments({
    preuveType: preuve.preuve_type,
    canMutateReferentiels,
    audit,
  });
};

/**
 * Affiche le titre d'un sous-ensemble de documents d'une demande de
 * labellisation ou d'audit.
 */
const Title = (props: { info: TCycleInfo }) => {
  const { info } = props;
  const { etoile, status, annee, audit } = info;
  const labelEtoile = etoile ? numLabels[parseInt(etoile) as Etoile] : null;
  const en_cours = status === 'demande_envoyee' || status === 'audit_en_cours';
  const label = annee + (en_cours ? ' (en cours)' : '') + ' - ';

  if (etoile) {
    return (
      <>
        {label}
        <span className="capitalize">{labelEtoile}</span> {appLabels.etoile}
      </>
    );
  }

  if (audit) {
    return (
      <>
        {label}
        <span>{appLabels.auditContratObjectifTerritorialCOT}</span>
      </>
    );
  }

  return null;
};

// donne les infos du cycle d'audit/labellisation associé à un sous-ensemble de preuves
const getCycleInfo = (preuves: TPreuveAuditEtLabellisation[]) => {
  const demande = preuves.find((p) => p.demande)?.demande || null;
  const audit = preuves?.find((p) => p.audit)?.audit || null;
  const d = audit?.date_fin || audit?.date_debut || demande?.date;
  const date = d ? new Date(d) : new Date();
  const annee = date.getFullYear();
  const status = getParcoursLabellisationStatus({ demande, audit });
  const timestamp = date.getTime();

  const etoile = demande?.etoiles;
  return { timestamp, annee, audit, demande, etoile, status };
};
type TCycleInfo = ReturnType<typeof getCycleInfo>;

// ajoute les infos du cycle d'audit/labellisation associé à un sous-ensemble de preuves
export const addInfoToEntry = (
  entry: [id: string, docs: TPreuveAuditEtLabellisation[]]
) => {
  const [id, docs] = entry;
  return {
    id,
    docs,
    info: getCycleInfo(docs),
  };
};
