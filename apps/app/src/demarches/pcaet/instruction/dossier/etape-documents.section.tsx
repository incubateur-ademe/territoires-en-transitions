'use client';

import { DemarcheDocumentsTable } from '@/app/demarches/components/documents.table';
import { DemarcheSection } from '@/app/demarches/components/section';
import { appLabels } from '@/app/labels/catalog';
import { useDownloadDossierDocument } from '../../data/use-download-demarche-document';
import {
  computeDemarcheDocumentsCoverage,
  DemarcheTypeEnum,
  type DemarcheDocumentDepose,
  type DemarcheDocumentsSnapshot,
} from '@tet/domain/demarches';
import { useMemo } from 'react';
import type { DossierInstructionRef } from '../dossier-instruction-ref';

const noop = () => undefined;

export const EtapeDocumentsSection = ({
  dossierRef,
  documents,
}: {
  dossierRef: DossierInstructionRef;
  documents: DemarcheDocumentsSnapshot;
}) => {
  const { mutate: downloadDossierDocument } = useDownloadDossierDocument();

  const coverage = useMemo(
    () => computeDemarcheDocumentsCoverage(documents),
    [documents]
  );

  const downloadDemarcheDocument = ({ documentId }: DemarcheDocumentDepose) => {
    downloadDossierDocument({ ...dossierRef, documentId });
  };

  return (
    <DemarcheSection
      title={appLabels.instructionDossierEtapeDocuments}
      description={appLabels.instructionDossierEtapeDocumentsDescription}
      className="gap-2"
    >
      <DemarcheDocumentsTable
        demarcheType={DemarcheTypeEnum.PCAET}
        etape="amont"
        config={documents.config}
        definitions={documents.definitions}
        documents={documents.documents}
        documentsAdditional={documents.documentsAdditional}
        coverage={coverage}
        isEtapeReadonly
        hideEmptyRows
        onAddFichier={noop}
        onRemoveDocument={noop}
        onToggleCouverture={noop}
        onCreateAdditional={noop}
        onRenameAdditional={noop}
        onAddFichierAdditional={noop}
        onRemoveAdditional={noop}
        onDownload={downloadDemarcheDocument}
      />
    </DemarcheSection>
  );
};
