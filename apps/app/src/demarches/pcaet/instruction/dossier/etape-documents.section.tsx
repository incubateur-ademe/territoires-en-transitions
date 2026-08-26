'use client';

import { DemarcheDocumentsTable } from '@/app/demarches/components/documents.table';
import { DemarcheSection } from '@/app/demarches/components/section';
import { appLabels } from '@/app/labels/catalog';
import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  computeDemarcheDocumentsCoverage,
  DemarcheTypeEnum,
  type DemarcheDocumentDepose,
  type DemarcheDocumentsSnapshot,
} from '@tet/domain/demarches';
import { useMemo } from 'react';

const noop = () => undefined;

export const EtapeDocumentsSection = ({
  demandeAvisId,
  documents,
}: {
  demandeAvisId: number;
  documents: DemarcheDocumentsSnapshot;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const coverage = useMemo(
    () => computeDemarcheDocumentsCoverage(documents),
    [documents]
  );

  const downloadDocument = async ({ documentId }: DemarcheDocumentDepose) => {
    const { url, filename } = await queryClient.fetchQuery(
      trpc.demarches.pcaet.getDossierDocumentUrl.queryOptions(
        { demandeAvisId, documentId },
        { staleTime: 0 }
      )
    );
    const response = await fetch(url);
    saveBlob(await response.blob(), filename);
    return true;
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
        onAddFichier={noop}
        onRemoveDocument={noop}
        onToggleCouverture={noop}
        onCreateAdditional={noop}
        onRenameAdditional={noop}
        onAddFichierAdditional={noop}
        onRemoveAdditional={noop}
        onDownload={downloadDocument}
      />
    </DemarcheSection>
  );
};
