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
import { DownloadDossierDocumentsButton } from './download-dossier-documents.button';

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

  // Même périmètre que l'archive : le dossier transmis, pièces libres comprises.
  const aDesFichiers =
    documents.documents.some(
      ({ etape, fichier }) => etape === 'amont' && fichier !== null
    ) ||
    documents.documentsAdditional.some(
      ({ etape, fichier }) => etape === 'amont' && fichier !== null
    );

  const downloadDemarcheDocument = ({ documentId }: DemarcheDocumentDepose) => {
    downloadDossierDocument({ ...dossierRef, documentId });
  };

  return (
    <DemarcheSection
      title={appLabels.instructionDossierEtapeDocuments}
      description={appLabels.instructionDossierEtapeDocumentsDescription}
      action={
        <DownloadDossierDocumentsButton
          dossierRef={dossierRef}
          disabled={!aDesFichiers}
        />
      }
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
