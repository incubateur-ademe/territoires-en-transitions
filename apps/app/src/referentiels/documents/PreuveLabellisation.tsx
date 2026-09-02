import { appLabels } from '@/app/labels/catalog';
import { AuditEnCours } from '@/app/referentiels/audits/types';
import { canUserUpdateAuditReport } from '@/app/referentiels/preuves/Bibliotheque/canUserUpdateAuditReport';
import CarteDocument from '@/app/referentiels/preuves/Bibliotheque/CarteDocument';
import {
  CarteDocumentAction,
  MUTATION_ACTIONS,
} from '@/app/referentiels/preuves/Bibliotheque/carte-document-action';
import {
  PreuveAudit,
  PreuveAuditEtLabellisation,
} from '@/app/referentiels/preuves/Bibliotheque/types';
import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
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
    docs: PreuveAuditEtLabellisation[];
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
  preuves: PreuveAuditEtLabellisation[];
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
  preuve: PreuveAuditEtLabellisation;
  info: TCycleInfo;
}) => {
  const { hasCollectivitePermission, hasReferentielPermission } =
    useCurrentCollectivite();
  const user = useUser();

  const audit = preuve.preuveType === 'audit' ? preuve.audit : null;
  const referentielId =
    preuve.demande?.referentiel ?? audit?.referentielId ?? null;

  const canMutateReferentiels = referentielId
    ? hasReferentielPermission('referentiels.mutate', referentielId)
    : hasCollectivitePermission('referentiels.mutate');

  const canUpdate = canUpdateAuditOrLabellisationPreuve({
    preuve,
    user,
    audit: info.audit,
    canMutateReferentiels,
  });
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();

  const allowedActions: CarteDocumentAction[] = [
    ...(canUpdate ? [...MUTATION_ACTIONS, 'replace' as const] : []),
    ...(isSuperAdminRoleEnabled ? ['reclassify' as const] : []),
  ];

  return (
    <CarteDocument
      document={preuve}
      allowedActions={allowedActions}
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
  preuve: PreuveAuditEtLabellisation;
  user: UserRolesAndPermissions;
  audit: AuditEnCours | null;
  canMutateReferentiels: boolean;
}): boolean => {
  if (preuve.preuveType === 'audit') {
    return canUserUpdateAuditReport(user, preuve);
  }
  return canUserUpdateCandidatureDocuments({
    preuveType: preuve.preuveType,
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
const isPreuveAudit = (
  preuve: PreuveAuditEtLabellisation
): preuve is PreuveAudit => preuve.preuveType === 'audit';

const getCycleInfo = (preuves: PreuveAuditEtLabellisation[]) => {
  const demande = preuves.find((preuve) => preuve.demande)?.demande ?? null;
  const audit = preuves.find(isPreuveAudit)?.audit ?? null;
  const dateCycle = audit?.dateFin || audit?.dateDebut || demande?.date;
  const date = dateCycle ? new Date(dateCycle) : new Date();
  const annee = date.getFullYear();
  const status = getParcoursLabellisationStatus({ demande, audit });
  const timestamp = date.getTime();

  const etoile = demande?.etoiles;
  return { timestamp, annee, audit, demande, etoile, status };
};
type TCycleInfo = ReturnType<typeof getCycleInfo>;

// ajoute les infos du cycle d'audit/labellisation associé à un sous-ensemble de preuves
export const addInfoToEntry = (
  entry: [id: string, docs: PreuveAuditEtLabellisation[]]
) => {
  const [id, docs] = entry;
  return {
    id,
    docs,
    info: getCycleInfo(docs),
  };
};
