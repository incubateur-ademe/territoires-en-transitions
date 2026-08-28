'use client';

import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import type { RouterOutput } from '@tet/api';
import {
  fenetreAvisOuverte,
  type PcaetAvisAuTitreDe,
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
  /**
   * Titres retenus à l'ouverture, `null` modale fermée. Les figer plutôt que
   * de suivre le dossier : valider le dernier avis le rend « instruit » et vide
   * les titres restants, ce qui ferait disparaître la modale au moment même où
   * elle doit accuser réception.
   */
  const [titresAFinaliser, setTitresAFinaliser] = useState<
    PcaetAvisAuTitreDe[] | null
  >(null);

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

  /**
   * L'état du dossier ne décide que de ce qui s'affiche à la place du bouton :
   * `instruitLe` ne vaut que si tous les titres attendus sont rendus, et
   * proposer de « finaliser » n'aurait alors plus de sens — la date de l'avis
   * rendu est l'information utile.
   */
  const declencheur = dossier.instruitLe ? (
    <p
      className="m-0 rounded-md border border-success-3 bg-success-2 px-3 py-2 text-center text-sm font-medium text-success-1"
      data-test="demarches.pcaet.instruction.instruit-le"
    >
      {appLabels.instructionDossierInstruitLe({
        date: getTextFormattedDate({ date: dossier.instruitLe }),
      })}
    </p>
  ) : titresDisponibles.length === 0 || !isFenetreOuverte ? (
    <Tooltip
      label={
        isFenetreOuverte
          ? appLabels.instructionFinaliserTousTitresDeposes
          : appLabels.instructionFinaliserVerrouille
      }
    >
      <span tabIndex={0} className="inline-flex rounded outline-primary">
        <Button
          disabled
          size="sm"
          className="w-fit"
          data-test="demarches.pcaet.instruction.finaliser"
        >
          {appLabels.instructionFinaliserBouton}
        </Button>
      </span>
    </Tooltip>
  ) : (
    <Button
      size="sm"
      className="w-fit"
      data-test="demarches.pcaet.instruction.finaliser"
      onClick={() => setTitresAFinaliser(titresDisponibles)}
    >
      {appLabels.instructionFinaliserBouton}
    </Button>
  );

  // La modale vit hors de ce choix : elle ne dépend que de son propre état,
  // sinon le dépôt du dernier avis la démonterait en changeant le déclencheur.
  return (
    <>
      {declencheur}
      {titresAFinaliser && (
        <FinaliserInstructionModal
          dossier={dossier}
          titresDisponibles={titresAFinaliser}
          onClose={() => setTitresAFinaliser(null)}
        />
      )}
    </>
  );
};
