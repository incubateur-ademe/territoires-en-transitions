'use client';

import { makeDemandesAvisUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  PcaetInstructionPartieEnum,
  pcaetInstructionPartieValues,
  type PcaetInstructionPartie,
} from '@tet/domain/demarches';
import { Button, cn, Icon } from '@tet/ui';
import Link from 'next/link';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useDossierInstruction } from './data/use-dossier-instruction';
import { DossierInstructionHeader } from './dossier.header';
import { EtapeDiagnosticSection } from './etape-diagnostic.section';
import { EtapeDocumentsSection } from './etape-documents.section';
import { EtapePlanSection } from './etape-plan.section';
import type { EtapeInstruction } from './etapes-instruction.side-panel-content';
import { FinaliserInstructionButton } from './finaliser-instruction.button';
import { useEtapesInstructionSidePanel } from './use-etapes-instruction-side-panel';
import { ValiderPartieButton } from './valider-partie.button';

const ETAPE_LABELS: Record<PcaetInstructionPartie, string> = {
  documents: appLabels.instructionDossierEtapeDocuments,
  diagnostic: appLabels.instructionDossierEtapeDiagnostic,
  plan: appLabels.instructionDossierEtapePlan,
};

const ETAPE_DESCRIPTIONS: Record<PcaetInstructionPartie, string> = {
  documents: appLabels.instructionDossierEtapeDocumentsDescription,
  diagnostic: appLabels.instructionDossierEtapeDiagnosticDescription,
  plan: appLabels.instructionDossierEtapePlanDescription,
};

export const DossierInstructionPage = ({
  demandeAvisId,
}: {
  demandeAvisId: number;
}) => {
  const collectiviteId = useCollectiviteId();
  const { dossier, isLoading, isError, refetch } =
    useDossierInstruction(demandeAvisId);
  const [etape, setEtape] = useQueryState(
    'etape',
    parseAsStringLiteral(pcaetInstructionPartieValues).withDefault(
      PcaetInstructionPartieEnum.DOCUMENTS
    )
  );

  const etapes: EtapeInstruction[] = pcaetInstructionPartieValues.map(
    (key) => ({
      key,
      label: ETAPE_LABELS[key],
      description: ETAPE_DESCRIPTIONS[key],
      isValidee:
        dossier?.partiesValidees.some(({ partie }) => partie === key) ?? false,
    })
  );

  const { isOpen, toggle } = useEtapesInstructionSidePanel(
    {
      etapes,
      activeEtape: etape,
      onSelect: setEtape,
      footer: dossier ? <FinaliserInstructionButton dossier={dossier} /> : null,
    },
    { collectiviteId, demandeAvisId }
  );

  if (isLoading) {
    return (
      <div className="flex grow items-center justify-center">
        <SpinnerLoader />
      </div>
    );
  }

  if (isError || !dossier) {
    return (
      <ErrorCard
        title={appLabels.uneErreurEstSurvenue}
        retry={() => refetch()}
      />
    );
  }

  const footer = <ValiderPartieButton dossier={dossier} partie={etape} />;

  return (
    <div
      data-test="demarches.pcaet.instruction.dossier"
      className="flex flex-col gap-6 pb-12"
    >
      <div className="flex flex-col gap-2">
        <Link
          href={makeDemandesAvisUrl({ collectiviteId })}
          className="flex items-center gap-1 w-fit text-sm text-primary-8 hover:underline"
        >
          <Icon icon="arrow-left-line" size="sm" />
          {appLabels.instructionDossierRetourListe}
        </Link>

        <DossierInstructionHeader
          dossier={dossier}
          action={
            <Button
              variant="grey"
              size="xs"
              icon="list-check"
              onClick={toggle}
              aria-pressed={isOpen}
              data-test="demarches.pcaet.instruction.etapes-panneau-bouton"
              className={cn(
                isOpen
                  ? 'bg-primary-9 hover:!bg-primary-9 text-white hover:!text-white'
                  : 'text-grey-8 border-grey-4'
              )}
            >
              {appLabels.instructionDossierPanneauBouton}
            </Button>
          }
        />
      </div>

      {etape === PcaetInstructionPartieEnum.DOCUMENTS && (
        <EtapeDocumentsSection
          demandeAvisId={demandeAvisId}
          documents={dossier.documents}
          footer={footer}
        />
      )}
      {etape === PcaetInstructionPartieEnum.DIAGNOSTIC && (
        <EtapeDiagnosticSection
          demandeAvisId={demandeAvisId}
          demarcheId={dossier.demarcheId}
          footer={footer}
        />
      )}
      {etape === PcaetInstructionPartieEnum.PLAN && (
        <EtapePlanSection footer={footer} />
      )}
    </div>
  );
};
