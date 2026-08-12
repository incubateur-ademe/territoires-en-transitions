'use client';

import { appLabels } from '@/app/labels/catalog';
import { usePreuvesLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { EditerDocumentProps } from '@/app/referentiels/preuves/Bibliotheque/EditerDocumentModal';
import {
  AuditLabellisationReferentielId,
  ObjetPreuve,
  ObjetPreuveEnum,
  selectPreuvesByObjet,
} from '@tet/domain/referentiels';
import { ChecklistTable, InlineLink } from '@tet/ui';
import { ReactElement } from 'react';
import { useChecklist } from '../../../../checklist.context';
import { DocumentLine } from '../document-line';
import { DownloadPreuveButton } from '../download-preuve-button';
import { UploadPreuveButton } from '../upload-preuve-button';
import { DownloadableFichier } from '../use-download-preuve';
import { DeletePreuveButton } from './delete-preuve-button';
import { RenamePreuveButton } from './rename-preuve-button';

export type CandidaturePreuve = Omit<
  EditerDocumentProps['preuve'],
  'fichier'
> & {
  id: number;
  objet: ObjetPreuve | null;
  fichier: (DownloadableFichier & { confidentiel: boolean | null }) | null;
};

const DOCUMENTS_CANDIDATURE: Record<
  AuditLabellisationReferentielId,
  readonly string[]
> = {
  cae: [appLabels.dossierDemandeLabellisation, appLabels.documentsAnnexes],
  eci: [appLabels.courrierActeCandidature, appLabels.arretePrefectoralEpci],
};

const DOCUMENTS_CANDIDATURE_URL =
  'https://phenomenal-trust-ee3da2c906.media.strapiapp.com/Acte_de_candidature_aux_labels_TETE_Aide_a_la_redaction_2026_c9a0befe16.docx';

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
    <InlineLink href={DOCUMENTS_CANDIDATURE_URL} openInNewTab>
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
  <li>
    <DocumentLine filename={preuve.fichier?.filename}>
      {preuve.fichier && <DownloadPreuveButton fichier={preuve.fichier} />}
      {canEdit && (
        <>
          <RenamePreuveButton preuve={preuve} />
          <DeletePreuveButton preuveId={preuve.id} />
        </>
      )}
    </DocumentLine>
  </li>
);

const PreuvesList = ({
  documents,
  canEdit,
}: {
  documents: readonly CandidaturePreuve[];
  canEdit: boolean;
}): ReactElement | null => {
  if (documents.length === 0) {
    return null;
  }

  return (
    <ul className="m-0 flex flex-col gap-1">
      {documents.map((preuve) => (
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
  documents,
  canEdit,
}: {
  documents: readonly CandidaturePreuve[];
  canEdit: boolean;
}): ReactElement => (
  <div className="flex flex-col gap-3">
    <PreuvesList documents={documents} canEdit={canEdit} />
    {canEdit && (
      <UploadPreuveButton
        objet={ObjetPreuveEnum.CANDIDATURE}
        title={appLabels.ajouterDocument}
        label={appLabels.ajouterDocument}
      />
    )}
  </div>
);

const CandidatureDocumentsRowWithDemande = ({
  referentielId,
  demandeId,
  canEdit,
}: {
  referentielId: AuditLabellisationReferentielId;
  demandeId: number;
  canEdit: boolean;
}): ReactElement => {
  const { data: preuves } = usePreuvesLabellisation(demandeId);
  const documents = selectPreuvesByObjet({
    preuves: preuves ?? [],
    objet: ObjetPreuveEnum.CANDIDATURE,
  });

  return (
    <ChecklistTable.Row
      done={documents.length > 0}
      criterion={{
        label: <CandidatureDocumentsCriterion referentielId={referentielId} />,
      }}
      answer={
        <CandidatureDocumentsAnswer documents={documents} canEdit={canEdit} />
      }
    />
  );
};

export const CandidatureDocumentsRow = (): ReactElement | null => {
  const { parcours, referentielId, cycle } = useChecklist();

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
      canEdit={
        parcours.canModifyCandidatureDocuments &&
        cycle.viewerRole === 'auditee'
      }
    />
  );
};
