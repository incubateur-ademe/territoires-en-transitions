'use client';

import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import type { RouterOutput } from '@tet/api';
import {
  fenetreAvisOuverte,
  type PcaetInstructionPartie,
} from '@tet/domain/demarches';
import { Button } from '@tet/ui';
import { useValiderPartieInstruction } from './data/use-valider-partie-instruction';

type Dossier = RouterOutput['demarches']['pcaet']['getDossierInstruction'];

type Props = {
  dossier: Dossier;
  partie: PcaetInstructionPartie;
};

export const ValiderPartieButton = ({ dossier, partie }: Props) => {
  const { mutate, isPending } = useValiderPartieInstruction(
    dossier.demandeAvisId
  );

  const isFenetreOuverte = fenetreAvisOuverte(
    { demarcheStatus: dossier.status, avisDeadlineAt: dossier.avisDeadlineAt },
    new Date()
  );

  const validation = dossier.partiesValidees.find(
    (validee) => validee.partie === partie
  );

  if (!isFenetreOuverte) {
    return (
      <p className="text-sm text-grey-7 m-0 text-right">
        {appLabels.instructionDossierValidationsVerrouillees}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {validation && (
        <span className="text-sm text-grey-7">
          {appLabels.instructionDossierPartieValideeLe({
            date: getTextFormattedDate({ date: validation.valideLe }),
          })}
        </span>
      )}
      <Button
        variant={validation ? 'grey' : 'primary'}
        size="sm"
        icon="check-line"
        iconPosition="right"
        disabled={isPending}
        data-test="demarches.pcaet.instruction.valider-partie"
        onClick={() =>
          mutate({
            demandeAvisId: dossier.demandeAvisId,
            partie,
            validee: !validation,
          })
        }
      >
        {validation
          ? appLabels.instructionDossierDevaliderPartie
          : appLabels.instructionDossierValiderPartie}
      </Button>
    </div>
  );
};
