import { appLabels } from '@/app/labels/catalog';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { AvancementObjectif, AvancementObjectifEtat } from '@tet/domain/plans';
import { InfoTooltip } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';

const NBSP = ' ';

export const formatPourcentage = (ratio: number) =>
  `${toLocaleFixed(Math.round(ratio * 100), 0)}${NBSP}%`;

export const formatEvolution = (ratio: number) => {
  const signe = ratio > 0 ? '+' : ratio < 0 ? '−' : '';
  return `${signe}${toLocaleFixed(Math.abs(ratio * 100), 1)}${NBSP}%`;
};

// depuis un départ nul, l'évolution se dit en valeur et non en pourcentage
const formatEcart = (ecart: number, formatValeur: (valeur: number) => string) =>
  `${ecart > 0 ? '+' : '−'}${formatValeur(Math.abs(ecart))}`;

const FILL_CLASSNAMES: Partial<Record<AvancementObjectifEtat, string>> = {
  'a-l-heure': 'bg-success-1',
  atteint: 'bg-success-1',
  'en-retard': 'bg-warning-1',
};

const getLibelle = (
  {
    etat,
    chemin,
    tempsEcoule,
    depart,
    dernier,
    cible,
    evolutionDepuisDepart,
  }: AvancementObjectif,
  formatValeur: (valeur: number) => string
): string => {
  switch (etat) {
    case 'atteint':
      return appLabels.indicateursObjectifsAtteint;
    case 'echeance-atteinte':
      return appLabels.indicateursObjectifsEcheanceAtteinte(cible.annee);
    case 'echeance-manquee':
      return appLabels.indicateursObjectifsEcheanceManquee(
        cible.annee,
        formatValeur(dernier.valeur),
        formatValeur(cible.valeur)
      );
    case 'en-recul':
      return appLabels.indicateursObjectifsEnRecul(
        evolutionDepuisDepart === null
          ? formatEcart(dernier.valeur - depart.valeur, formatValeur)
          : formatEvolution(evolutionDepuisDepart),
        depart.annee
      );
    default:
      return appLabels.indicateursObjectifsCheminTempsEcoule(
        formatPourcentage(chemin),
        formatPourcentage(tempsEcoule),
        depart.annee
      );
  }
};

/**
 * Le chemin parcouru vers l'objectif : une barre colorée selon le rythme, avec
 * un repère au temps écoulé. Après l'échéance, seul le verdict reste.
 */
export const IndicateurObjectifAvancement = ({
  avancement,
  formatValeur,
}: {
  avancement: AvancementObjectif;
  formatValeur: (valeur: number) => string;
}) => {
  const { etat, chemin, tempsEcoule } = avancement;
  const isEcheancePassee =
    etat === 'echeance-atteinte' || etat === 'echeance-manquee';
  const libelle = getLibelle(avancement, formatValeur);
  const largeur = Math.min(1, Math.max(0, chemin)) * 100;

  return (
    <div
      className="flex flex-col gap-1.5"
      data-test="plans.suivi.indicateurs-objectifs.avancement"
    >
      {!isEcheancePassee && (
        <div
          role="progressbar"
          aria-label={appLabels.indicateursObjectifsAvancement}
          aria-valuenow={Math.round(largeur)}
          aria-valuetext={libelle}
          className="relative h-2 w-full rounded-full bg-grey-3"
        >
          <div
            className={cn('h-full rounded-full', FILL_CLASSNAMES[etat])}
            style={{ width: `${largeur}%` }}
          />
          <div
            className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-primary-9"
            style={{ left: `${tempsEcoule * 100}%` }}
          />
        </div>
      )}
      <div className="flex items-center gap-1">
        <span
          className={cn(
            'text-xs',
            etat === 'en-recul' || etat === 'echeance-manquee'
              ? 'text-error-1 font-bold'
              : etat === 'atteint' || etat === 'echeance-atteinte'
              ? 'text-success-1 font-bold'
              : 'text-grey-8'
          )}
        >
          {libelle}
        </span>
        {!isEcheancePassee && (
          <InfoTooltip
            label={appLabels.indicateursObjectifsFormule}
            ariaLabel={appLabels.indicateursObjectifsFormule}
            size="xs"
          />
        )}
      </div>
    </div>
  );
};
