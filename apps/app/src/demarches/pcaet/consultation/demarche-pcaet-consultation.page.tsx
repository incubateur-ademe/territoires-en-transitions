'use client';

import { useDownloadDocument } from '@/app/collectivites/documents/data/use-download-document';
import { DemarcheDocumentsTable } from '@/app/demarches/components/documents.table';
import { DocumentsBloc } from '@/app/demarches/components/documents-bloc';
import { DemarcheSection } from '@/app/demarches/components/section';
import { PlansContenu } from '@/app/demarches/pcaet/components/plans-contenu';
import { DiagnosticTabs } from '@/app/demarches/pcaet/diagnostic/diagnostic.tabs';
import {
  DEMARCHE_SECTION_KEYS,
  type DemarcheSectionKey,
} from '@/app/demarches/steps';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import {
  computeDemarcheDocumentsCoverage,
  DemarcheTypeEnum,
  type DemarcheDocumentAdditional,
  type DemarcheDocumentDepose,
} from '@tet/domain/demarches';
import { ButtonGroup } from '@tet/ui';
import { notFound } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { ComponentProps, useMemo } from 'react';
import { ConsultationHeader } from './consultation.header';
import {
  isNotFoundError,
  useDemarchePcaetConsultation,
  usePublicDiagnostic,
  type DemarchePcaetConsultation,
} from './data/use-demarche-pcaet-consultation';

const ETAPE_LABELS: Record<DemarcheSectionKey, string> = {
  documents: appLabels.instructionDossierEtapeDocuments,
  diagnostic: appLabels.instructionDossierEtapeDiagnostic,
  plan: appLabels.instructionDossierEtapePlan,
};

const noop = () => undefined;

/**
 * Une démarche PCAET publique, en lecture seule : ses pièces, son diagnostic
 * et son programme d'actions. Ni avis, ni avancement, ni rien qui s'édite.
 */
export const DemarchePcaetConsultationPage = ({
  collectiviteId,
  demarcheId,
}: {
  /** Celle de l'URL : le serveur ne sert la démarche que sous la sienne. */
  collectiviteId: number;
  demarcheId: number;
}) => {
  const { data, isLoading, isError, error, refetch } =
    useDemarchePcaetConsultation({ collectiviteId, demarcheId });
  const [etape, setEtape] = useQueryState(
    'etape',
    parseAsStringLiteral(DEMARCHE_SECTION_KEYS).withDefault('diagnostic')
  );

  if (isLoading) {
    return (
      <div className="flex grow items-center justify-center">
        <SpinnerLoader />
      </div>
    );
  }

  if (isNotFoundError(error)) {
    notFound();
  }

  if (isError || !data) {
    return (
      <ErrorCard
        title={appLabels.uneErreurEstSurvenue}
        retry={() => refetch()}
      />
    );
  }

  return (
    <div
      data-test="demarches.pcaet.consultation"
      className="flex flex-col gap-6 pb-12"
    >
      <ConsultationHeader demarche={data.demarche} />

      <ButtonGroup
        size="sm"
        activeButtonId={etape}
        buttons={DEMARCHE_SECTION_KEYS.map((key) => ({
          id: key,
          children: ETAPE_LABELS[key],
          onClick: () => setEtape(key),
          dataTest: `demarches.pcaet.consultation.etape-${key}`,
        }))}
      />

      {etape === 'documents' && <DocumentsSection consultation={data} />}
      {etape === 'diagnostic' && (
        <DiagnosticSection
          collectiviteId={collectiviteId}
          demarcheId={demarcheId}
        />
      )}
      {etape === 'plan' && (
        <DemarcheSection
          title={appLabels.instructionDossierEtapePlan}
          description={appLabels.instructionDossierEtapePlanDescription}
        >
          <PlansContenu
            plans={data.plans}
            emptyTitle={appLabels.instructionDossierPlanAucun}
            dataTestPrefix="demarches.pcaet.consultation"
            collectiviteId={data.demarche.collectiviteId}
          />
        </DemarcheSection>
      )}
    </div>
  );
};

const DiagnosticSection = ({
  collectiviteId,
  demarcheId,
}: {
  collectiviteId: number;
  demarcheId: number;
}) => {
  const { data, isLoading, isError, refetch } = usePublicDiagnostic({
    collectiviteId,
    demarcheId,
  });

  return (
    <DiagnosticTabs
      demarcheId={demarcheId}
      diagnostic={data ?? null}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      isReadonly
      title={appLabels.instructionDossierEtapeDiagnostic}
      description={appLabels.instructionDossierEtapeDiagnosticDescription}
    />
  );
};

/**
 * Les pièces telles que la collectivité les lit une fois son PCAET adopté :
 * celles de l'adoption, puis le dossier soumis aux avis. Un dépôt hors
 * plateforme n'a pas connu de coupure d'instruction : ses deux temps se lisent
 * dans un seul tableau, pièces libres de l'amont comprises.
 */
const DocumentsSection = ({
  consultation: { demarche, documents },
}: {
  consultation: DemarchePcaetConsultation;
}) => {
  const { mutate: downloadDocument } = useDownloadDocument();
  const coverage = useMemo(
    () => computeDemarcheDocumentsCoverage(documents),
    [documents]
  );

  const download = ({
    fichier,
  }: DemarcheDocumentDepose | DemarcheDocumentAdditional) => {
    if (fichier) {
      downloadDocument({
        collectiviteId: demarche.collectiviteId,
        fichierId: fichier.id,
      });
    }
  };

  const tableProps: ComponentProps<typeof DemarcheDocumentsTable> = {
    demarcheType: DemarcheTypeEnum.PCAET,
    etape: 'aval',
    config: documents.config,
    definitions: documents.definitions,
    documents: documents.documents,
    documentsAdditional: documents.documentsAdditional,
    coverage,
    isEtapeReadonly: true,
    hideEmptyRows: true,
    onAddFichier: noop,
    onRemoveDocument: noop,
    onToggleCouverture: noop,
    onCreateAdditional: noop,
    onRenameAdditional: noop,
    onAddFichierAdditional: noop,
    onRemoveAdditional: noop,
    onDownload: download,
    onDownloadAdditional: download,
  };

  return (
    <DemarcheSection
      title={appLabels.instructionDossierEtapeDocuments}
      description={
        demarche.transmittedOffPlatform
          ? appLabels.demarcheConsultationDocumentsHorsPlateformeDescription
          : appLabels.demarcheConsultationDocumentsDescription
      }
      className="gap-2"
    >
      {demarche.transmittedOffPlatform ? (
        <DemarcheDocumentsTable {...tableProps} mergeEtapes />
      ) : (
        <div className="flex flex-col gap-8">
          <DocumentsBloc
            titre={appLabels.demarcheDocumentsAdoptionTitre}
            description={appLabels.demarcheDocumentsAdoptionDescription}
          >
            <DemarcheDocumentsTable {...tableProps} section="adoption" />
          </DocumentsBloc>
          <DocumentsBloc
            titre={appLabels.demarcheDocumentsDossierTransmisTitre}
            description={
              appLabels.demarcheDocumentsDossierTransmisAdopteDescription
            }
          >
            <DemarcheDocumentsTable
              {...tableProps}
              section="dossier-transmis"
            />
          </DocumentsBloc>
        </div>
      )}
    </DemarcheSection>
  );
};
