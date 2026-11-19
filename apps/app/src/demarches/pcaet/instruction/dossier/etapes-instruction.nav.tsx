'use client';

import {
  StepsNavBar,
  StepsNavNextButton,
  StepsNavPreviousButton,
} from '@/app/demarches/components/steps-nav.bar';
import { serializePcaetDiagnosticTabQueryState } from '@/app/demarches/pcaet/diagnostic/use-pcaet-diagnostic-tab-query-state';
import { getStepsNavModel, type DemarcheStepItem } from '@/app/demarches/steps';
import { appLabels } from '@/app/labels/catalog';
import type { PcaetInstructionPartie } from '@tet/domain/demarches';
import { serializeEtapeInstructionQueryState } from './use-etape-instruction-query-state';

/**
 * Barre « Étape précédente | Étape suivante » du dossier d'instruction : le
 * même parcours que celui de la collectivité qui remplit son dépôt — le
 * diagnostic volet par volet, les documents, puis le programme d'actions.
 * L'agent avance sans rouvrir le panneau des étapes.
 *
 * Aucun acte de clôture ici : la finalisation de l'instruction reste dans le
 * panneau, avec les avis.
 */
export const EtapesInstructionNav = ({
  dossierPath,
  etape,
  topicCodes,
  currentTopicCode,
}: {
  dossierPath: string;
  etape: PcaetInstructionPartie;
  /** Les volets du diagnostic, vides tant qu'il n'est pas chargé. */
  topicCodes: readonly string[];
  currentTopicCode: string | null;
}) => {
  const { prev, next } = getStepsNavModel({
    etape: 'amont',
    activeSection: etape,
    hasDocuments: true,
    topicCodes,
    currentTopicCode,
  });

  if (!prev && !next) return null;

  const hrefOf = ({ section, topicCode }: DemarcheStepItem) =>
    serializePcaetDiagnosticTabQueryState(
      serializeEtapeInstructionQueryState(dossierPath, { etape: section }),
      { topic: topicCode }
    );

  return (
    <StepsNavBar
      ariaLabel={appLabels.instructionDossierEtapesNavAriaLabel}
      dataTest="demarches.pcaet.instruction.etapes-nav"
      previous={
        prev && (
          <StepsNavPreviousButton
            dataTest="demarches.pcaet.instruction.etapes-nav.previous"
            href={hrefOf(prev)}
          />
        )
      }
    >
      {next && (
        <StepsNavNextButton
          dataTest="demarches.pcaet.instruction.etapes-nav.next"
          href={hrefOf(next)}
        />
      )}
    </StepsNavBar>
  );
};
