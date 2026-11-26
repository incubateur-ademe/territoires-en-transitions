import { PlanSkeleton } from '../../models/plan-skeleton';
import { titlesMatch } from '../extract-actions/similar-titles';
import { DocumentUnit } from '../segment-document/document-unit';

// En dessous, un axe par fiche ne dit rien de la grille du document.
const MIN_FICHES = 2;
const LEADING_NUMBER = /^\s*(\d{1,2}(?:\.\d{1,2})*)\.?\s+(?=\S)/u;

/**
 * Quand le code a rangé chaque fiche sous un axe et que le squelette du modèle
 * n'en reprend pas la moitié, le modèle a pris une autre grille, par exemple
 * celle d'un guide national croisée dans le document, malgré le prompt qui
 * l'exclut : les axes du code l'emportent, dans l'ordre du document, avec
 * leurs sous-axes. Sinon le squelette reste celui du modèle.
 */
export const keepCodeAxes = (
  skeleton: PlanSkeleton,
  units: DocumentUnit[]
): { skeleton: PlanSkeleton; fromCode: boolean } => {
  const fiches = units.filter(
    (unit) => unit.kind === 'fiche' && !unit.continued
  );
  if (
    fiches.length < MIN_FICHES ||
    fiches.some((unit) => unit.headingPath.length === 0)
  ) {
    return { skeleton, fromCode: false };
  }
  const codeAxes = distinct(fiches.map((unit) => unit.headingPath[0]));
  const kept = codeAxes.filter((label) =>
    skeleton.axes.some(
      (axe) =>
        titlesMatch(label, axe.titre) ||
        titlesMatch(label, `${axe.numero} ${axe.titre}`)
    )
  );
  if (kept.length * 2 >= codeAxes.length) {
    return { skeleton, fromCode: false };
  }
  return {
    fromCode: true,
    skeleton: {
      axes: codeAxes.map((label, index) => {
        const axe = splitNumber(label, String(index + 1));
        const sousAxes = distinct(
          fiches
            .filter(
              (unit) =>
                unit.headingPath[0] === label && unit.headingPath.length > 1
            )
            .map((unit) => unit.headingPath[1])
        );
        return {
          ...axe,
          sousAxes: sousAxes.map((sousAxe, rank) =>
            splitNumber(sousAxe, `${axe.numero}.${rank + 1}`)
          ),
        };
      }),
    },
  };
};

const distinct = (labels: string[]): string[] => [...new Set(labels)];

const splitNumber = (
  label: string,
  fallback: string
): { numero: string; titre: string } => {
  const number = LEADING_NUMBER.exec(label);
  return number
    ? { numero: number[1], titre: label.slice(number[0].length).trim() }
    : { numero: fallback, titre: label.trim() };
};
