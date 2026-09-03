'use client';

import { appLabels } from '@/app/labels/catalog';
import { usePreuvesLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import {
  AuditLabellisationReferentielId,
  ObjetPreuveEnum,
  selectPreuvesByObjet,
} from '@tet/domain/referentiels';
import { ChecklistTable, InlineLink } from '@tet/ui';
import { ReactElement } from 'react';
import { useChecklist } from '../../../../checklist.context';
import { AnswerStack } from '../answer-stack';
import { PreuvesList } from '../preuves-list';
import { UploadPreuveButton } from '../upload-preuve-button';

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
        <AnswerStack>
          <PreuvesList preuves={documents} canEdit={canEdit} />
          {canEdit && (
            <UploadPreuveButton
              objet={ObjetPreuveEnum.CANDIDATURE}
              title={appLabels.ajouterDocument}
              label={appLabels.ajouterDocument}
            />
          )}
        </AnswerStack>
      }
    />
  );
};

export const CandidatureDocumentsRow = (): ReactElement | null => {
  const { parcours, referentielId, canUpdateCandidatureDocuments } =
    useChecklist();

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
      canEdit={canUpdateCandidatureDocuments}
    />
  );
};
