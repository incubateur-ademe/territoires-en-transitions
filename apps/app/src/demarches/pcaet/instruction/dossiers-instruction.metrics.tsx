'use client';

import { appLabels } from '@/app/labels/catalog';
import { MetricCard } from '@/app/tableaux-de-bord/metrics/metric.card';
import type { RouterOutput } from '@tet/api';
import { PcaetStatutInstructionEnum } from '@tet/domain/demarches';
import { DELAI_INSTRUCTION_PLAFOND_JOURS } from './instruction.constants';

type CountByStatut =
  RouterOutput['demarches']['pcaet']['listDossiersInstruction']['countByStatut'];

/**
 * La charge d'un service qui instruit : ce qu'il lui reste à faire, ce qu'il a
 * rendu, et en combien de temps.
 *
 * Réservé aux services qui déposent un avis. Une DDT, une DR ADEME ou un
 * service national suivent les dossiers sans se prononcer : ces trois chiffres
 * ne mesureraient pas leur travail mais celui d'un autre, et le premier leur
 * réclamerait une action qui ne leur revient pas.
 */
export const DossiersInstructionMetrics = ({
  countByStatut,
  delaiMoyenJours,
}: {
  countByStatut: CountByStatut;
  /**
   * `null` tant qu'aucune instruction n'a abouti : il n'y a alors pas de moyenne
   * à afficher, et un zéro se lirait comme « instruit le jour même ».
   */
  delaiMoyenJours: number | null;
}) => {
  const aInstruire =
    countByStatut[PcaetStatutInstructionEnum.EN_INSTRUCTION] ?? 0;
  const instruits = countByStatut[PcaetStatutInstructionEnum.INSTRUIT] ?? 0;
  const estPlafonne =
    delaiMoyenJours !== null &&
    delaiMoyenJours > DELAI_INSTRUCTION_PLAFOND_JOURS;

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard
        title={appLabels.instructionStatATraiter}
        count={aInstruire}
      />
      <MetricCard
        title={appLabels.instructionStatInstruits({ count: instruits })}
        count={instruits}
      />
      <MetricCard
        title={
          delaiMoyenJours === null
            ? appLabels.instructionStatDelaiMoyenAucun
            : estPlafonne
            ? appLabels.instructionStatDelaiMoyenPlafonne({
                plafond: DELAI_INSTRUCTION_PLAFOND_JOURS,
              })
            : appLabels.instructionStatDelaiMoyen({ count: delaiMoyenJours })
        }
        count={
          delaiMoyenJours === null
            ? undefined
            : Math.min(delaiMoyenJours, DELAI_INSTRUCTION_PLAFOND_JOURS)
        }
      />
    </div>
  );
};
