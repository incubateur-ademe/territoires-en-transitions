import { PlanSkeleton } from '../../models/plan-skeleton';
import { titlesMatch } from '../extract-actions/similar-titles';

type SkeletonLabel = { numero: string; label: string };

export type AxisLabels = { axe: string; sousAxe: string };

const AXE_NUMBER = /^\s*(?:axe\s*)?(\d+|[ivx]+)\b(?!\.\d)/i;
const SOUS_AXE_NUMBER = /^\s*(\d+(?:\.\d+)+)/;

/**
 * Le modèle retape les libellés du squelette : une faute de frappe créait un
 * sous-axe fantôme, un numéro seul un sous-axe sans titre, le titre d'une
 * action pris pour celui de sa mesure un second « 1.5 ». Un libellé reprend la
 * graphie de l'entrée du squelette qu'il désigne : par son titre d'abord, par
 * son numéro sinon. Sans l'un ni l'autre, il reste tel quel.
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
  const hasNumero = (candidate: SkeletonLabel) =>
    candidate.numero.toLowerCase() === numero;
  const sameTitle = candidates.filter((candidate) =>
    titlesMatch(label, candidate.label)
  );
  // Deux titres proches : le numéro départage. Aucun : le numéro désigne.
  const matches =
    sameTitle.length === 1
      ? sameTitle
      : (sameTitle.length > 1 ? sameTitle : candidates).filter(hasNumero);
  // Deux entrées possibles : rien ne dit laquelle, le libellé reste.
  return matches.length === 1 ? matches[0].label : label;
};
