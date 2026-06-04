'use client';

import { appLabels } from '@/app/labels/catalog';
import { usePreuvesLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { AuditLabellisationReferentielId } from '@tet/domain/referentiels';
import { ChecklistTable, Icon, InlineLink } from '@tet/ui';
import { ReactElement } from 'react';
import { useChecklist } from '../../../checklist.context';
import { canUploadLabellisationDocument } from '../../rules/can-upload-labellisation-document';
import { DeletePreuveButton } from './delete-preuve-button';
import { UploadPreuveButton } from './upload-preuve-button';

type CandidaturePreuve = NonNullable<
  ReturnType<typeof usePreuvesLabellisation>['data']
>[number];

const DOCUMENTS_CANDIDATURE: Record<
  AuditLabellisationReferentielId,
  readonly string[]
> = {
  cae: [appLabels.dossierDemandeLabellisation, appLabels.documentsAnnexes],
  eci: [appLabels.courrierActeCandidature, appLabels.arretePrefectoralEpci],
};

const CandidatureDocumentsCriterion = ({
  referentielId,
}: {
  referentielId: AuditLabellisationReferentielId;
}): ReactElement => (
  <div className="flex flex-col gap-2">
    <span className="font-medium text-primary-10">
      {appLabels.labellisationAjouterDocumentsOfficielsCandidature}
    </span>
    <ul className="m-0">
      {DOCUMENTS_CANDIDATURE[referentielId].map((document) => (
        <li key={document}>{document}</li>
      ))}
    </ul>
    <InlineLink href={appLabels.acteCandidatureDocUrl} openInNewTab>
      {appLabels.acteCandidatureDownloadLink}
    </InlineLink>
  </div>
);

const CandidatureDocumentLine = ({
  preuve,
  canEdit,
}: {
  preuve: CandidaturePreuve;
  canEdit: boolean;
}): ReactElement => (
  <li className="flex items-center gap-2 text-sm text-grey-9">
    <Icon icon="file-text-line" size="sm" className="shrink-0 text-grey-7" />
    <span className="font-medium">{preuve.fichier?.filename}</span>
    {canEdit && (
      <>
        <UploadPreuveButton
          replacePreuveId={preuve.id}
          title={appLabels.remplacerLeFichier}
          label={appLabels.remplacerLeFichier}
        />
        <DeletePreuveButton preuveId={preuve.id} />
      </>
    )}
  </li>
);

const PreuvesList = ({
  demandeId,
  canEdit,
}: {
  demandeId: number;
  canEdit: boolean;
}): ReactElement | null => {
  const { data: preuves } = usePreuvesLabellisation(demandeId);

  if (!preuves || preuves.length === 0) {
    return null;
  }

  return (
    <ul className="m-0 flex flex-col gap-1">
      {preuves.map((preuve) => (
        <CandidatureDocumentLine
          key={preuve.id}
          preuve={preuve}
          canEdit={canEdit}
        />
      ))}
    </ul>
  );
};

const CandidatureDocumentsAnswer = ({
  demandeId,
  editable,
}: {
  demandeId: number;
  editable: boolean;
}): ReactElement => {
  const { hasCollectivitePermission, isRoleAuditeur } = useCurrentCollectivite();
  const canUpload =
    editable &&
    canUploadLabellisationDocument({
      canMutateReferentiels: hasCollectivitePermission('referentiels.mutate'),
      isAuditeur: isRoleAuditeur,
    });

  return (
    <div className="flex flex-col gap-3">
      <PreuvesList demandeId={demandeId} canEdit={canUpload} />
      {canUpload && (
        <UploadPreuveButton
          title={appLabels.ajouterDocument}
          label={appLabels.ajouterDocument}
        />
      )}
    </div>
  );
};

const CandidatureDocumentsRowWithDemande = ({
  referentielId,
  demandeId,
  editable,
}: {
  referentielId: AuditLabellisationReferentielId;
  demandeId: number;
  editable: boolean;
}): ReactElement => {
  const { data: preuves } = usePreuvesLabellisation(demandeId);
  const done = (preuves?.length ?? 0) > 0;

  return (
    <ChecklistTable.Row
      done={done}
      criterion={{
        label: <CandidatureDocumentsCriterion referentielId={referentielId} />,
      }}
      answer={
        <CandidatureDocumentsAnswer demandeId={demandeId} editable={editable} />
      }
    />
  );
};

export const CandidatureDocumentsRow = (): ReactElement | null => {
  const { parcours, referentielId } = useChecklist();

  if (!parcours) {
    return null;
  }

  const { demandeId } = parcours.acteEngagement;

  if (demandeId === null) {
    return (
      <ChecklistTable.Row
        done={false}
        criterion={{
          label: (
            <CandidatureDocumentsCriterion referentielId={referentielId} />
          ),
        }}
        answer={null}
      />
    );
  }

  return (
    <CandidatureDocumentsRowWithDemande
      referentielId={referentielId}
      demandeId={demandeId}
      editable={parcours.peutModifierDocumentsCandidature}
    />
  );
};
