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
import { ReactNode, useMemo } from 'react';

const noop = () => undefined;

export const EtapeDocumentsSection = ({
  demandeAvisId,
  documents,
  footer,
}: {
  demandeAvisId: number;
  documents: DemarcheDocumentsSnapshot;
  footer: ReactNode;
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
        definitions={documents.definitions}
        documents={documents.documents}
        coverage={coverage}
        isDocumentReadonly={() => true}
        onAddFichier={noop}
        onRemoveDocument={noop}
        onToggleCouverture={noop}
        onDownload={downloadDocument}
      />
      {footer}
    </DemarcheSection>
  );
};
