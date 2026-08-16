'use client';

import { appLabels } from '@/app/labels/catalog';
import type { RouterOutput } from '@tet/api';
import {
  fenetreAvisOuverte,
  pcaetInstructionPartieValues,
} from '@tet/domain/demarches';
import { Button, Tooltip } from '@tet/ui';
import { useState } from 'react';
import { FinaliserInstructionModal } from './finaliser-instruction.modal';

type Dossier = RouterOutput['demarches']['pcaet']['getDossierInstruction'];

export const FinaliserInstructionButton = ({
  dossier,
}: {
  dossier: Dossier;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toutesValidees = pcaetInstructionPartieValues.every((partie) =>
    dossier.partiesValidees.some((validee) => validee.partie === partie)
  );
  const isFenetreOuverte = fenetreAvisOuverte(
    { demarcheStatus: dossier.status, avisDeadlineAt: dossier.avisDeadlineAt },
    new Date()
  );

  if (!toutesValidees || !isFenetreOuverte) {
    return (
      <Tooltip
        label={
          isFenetreOuverte
            ? appLabels.instructionFinaliserAValider
            : appLabels.instructionFinaliserVerrouille
        }
      >
        <span tabIndex={0} className="inline-flex w-full rounded outline-primary">
          <Button
            disabled
            className="w-full justify-center"
            data-test="demarches.pcaet.instruction.finaliser"
          >
            {appLabels.instructionFinaliserBouton}
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <>
      <Button
        className="w-full justify-center"
        data-test="demarches.pcaet.instruction.finaliser"
        onClick={() => setIsModalOpen(true)}
      >
        {appLabels.instructionFinaliserBouton}
      </Button>
      {isModalOpen && (
        <FinaliserInstructionModal
          dossier={dossier}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
