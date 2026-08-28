'use client';

import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import type { RouterOutput } from '@tet/api';
import { fenetreAvisOuverte } from '@tet/domain/demarches';
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

  // Parmi les titres dont cette collectivité répond — la DREAL en porte deux,
  // le conseil régional un seul — ceux qui restent à rendre : un titre ne se
  // rend qu'une fois, et c'est ce qui reste qui dit s'il y a encore quelque
  // chose à finaliser.
  const titresDisponibles = dossier.titresDeposables.filter(
    (titre) => !dossier.avis.some((avis) => avis.auTitreDe === titre)
  );
  const isFenetreOuverte = fenetreAvisOuverte(
    { demarcheStatus: dossier.status, avisDeadlineAt: dossier.avisDeadlineAt },
    new Date()
  );

  // Destinataire en lecture — la DDT : le dossier se consulte, rien ne s'y
  // dépose. Le serveur refuse de toute façon, l'écran n'a pas à proposer
  // l'action.
  if (dossier.titresDeposables.length === 0) {
    return null;
  }

  // `instruitLe` ne vaut que si tous les titres attendus sont rendus : proposer
  // de « finaliser » n'aurait plus de sens, la date de l'avis rendu est
  // l'information utile.
  if (dossier.instruitLe) {
    return (
      <p
        className="m-0 rounded-md border border-success-3 bg-success-2 px-3 py-2 text-center text-sm font-medium text-success-1"
        data-test="demarches.pcaet.instruction.instruit-le"
      >
        {appLabels.instructionDossierInstruitLe({
          date: getTextFormattedDate({ date: dossier.instruitLe }),
        })}
      </p>
    );
  }

  if (titresDisponibles.length === 0 || !isFenetreOuverte) {
    return (
      <Tooltip
        label={
          isFenetreOuverte
            ? appLabels.instructionFinaliserTousTitresDeposes
            : appLabels.instructionFinaliserVerrouille
        }
      >
        <span
          tabIndex={0}
          className="inline-flex w-full rounded outline-primary"
        >
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
          titresDisponibles={titresDisponibles}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
