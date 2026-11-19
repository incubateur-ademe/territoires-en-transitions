import { PlanSkeleton } from '../../models/plan-skeleton';
import { titlesMatch } from '../extract-actions/similar-titles';

type SkeletonLabel = { numero: string; label: string };

export type AxisLabels = { axe: string; sousAxe: string };

const AXE_NUMBER = /^\s*(?:axe\s*)?(\d+|[ivx]+)\b(?!\.\d)/i;
const SOUS_AXE_NUMBER = /^\s*(\d+(?:\.\d+)+)/;
const NUMBER_PREFIX =
  /^\s*(?:axe\s*)?(?:[ivx]+|\d+(?:\.\d+)*)\b\s*[:.)\-–—]?\s*/i;

/**
 * Le modèle retape les libellés du squelette : une faute de frappe créait un
 * sous-axe fantôme, un numéro seul un sous-axe sans titre. Un libellé qui
 * désigne une entrée du squelette en reprend la graphie. Même numéro mais
 * autre titre : c'est un niveau que le squelette n'a pas, il reste tel quel.
 */
export const alignSkeletonLabels = (
  skeleton: PlanSkeleton
): ((labels: AxisLabels) => AxisLabels) => {
  const axes = skeleton.axes.map((axe) => ({
    numero: axe.numero.trim(),
    label: `Axe ${axe.numero.trim()} : ${axe.titre.trim()}`,
  }));
  const sousAxes = skeleton.axes.flatMap((axe) =>
    axe.sousAxes.map((sousAxe) => ({
      numero: sousAxe.numero.trim(),
      label: `${sousAxe.numero.trim()} ${sousAxe.titre.trim()}`,
    }))
  );
  return ({ axe, sousAxe }) => ({
    axe: alignLabel(axe, axes, AXE_NUMBER),
    sousAxe: alignLabel(sousAxe, sousAxes, SOUS_AXE_NUMBER),
  });
};

const alignLabel = (
  label: string,
  candidates: SkeletonLabel[],
  numberPattern: RegExp
): string => {
  if (!label.trim()) {
    return label;
  }
  const numero = numberPattern.exec(label)?.[1]?.toLowerCase();
  const hasTitle = label.replace(NUMBER_PREFIX, '').trim().length > 0;
  const matches = candidates.filter((candidate) =>
    numero === undefined
      ? titlesMatch(label, candidate.label)
      : candidate.numero.toLowerCase() === numero &&
        (!hasTitle || titlesMatch(label, candidate.label))
  );
  // Deux entrées possibles : rien ne dit laquelle, le libellé reste.
  return matches.length === 1 ? matches[0].label : label;
};
