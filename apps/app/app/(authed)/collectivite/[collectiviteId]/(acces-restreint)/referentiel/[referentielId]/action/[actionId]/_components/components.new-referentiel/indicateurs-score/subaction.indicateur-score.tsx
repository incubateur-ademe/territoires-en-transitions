import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { CalculScoreIndicatif } from '@tet/domain/referentiels';
import { cn } from '@tet/ui';

type Props = {
  action: ActionListItem;
  unite: string;
  calcul: CalculScoreIndicatif | null;
  valeurSelectionnee: { valeur: number } | null | undefined;
  size: 'sm' | 'md';
};

export const SubactionIndicateurScore = ({
  action,
  unite,
  calcul,
  valeurSelectionnee,
  size,
}: Props) => {
  const pointsPotentiels = action.score.pointPotentiel;
  const pointsFait = action.score.pointFait ?? 0;

  return (
    <div>
      <div className="flex flex-row justify-between items-baseline">
        <div className={cn('flex flex-row items-baseline')}>
          <span
            className={cn({
              'text-4xl': size === 'md',
              'text-3xl': size === 'sm',
              'text-primary-9 font-bold': valeurSelectionnee,
              'text-neutral-600': !valeurSelectionnee,
            })}
          >
            {valeurSelectionnee
              ? toLocaleFixed(valeurSelectionnee.valeur, 2)
              : '--'}
          </span>
          <span
            className={cn('text-neutral-700', { 'text-xs': size === 'sm' })}
          >
            &nbsp;{unite}
          </span>
        </div>
        <div className={cn('text-primary-9', { 'text-sm': size === 'sm' })}>
          <span className="font-bold">{toLocaleFixed(pointsFait, 2)}</span>
          <span>
            &nbsp;{'/'}&nbsp;
            {appLabels.scorePotentielPointCount({
              count: toLocaleFixed(pointsPotentiels, 2),
            })}
          </span>
        </div>
      </div>
      <ScoreProgressBar
        action={action}
        className="grow shrink max-sm:w-full mb-2"
      />
      <SubactionIndicateurScoreCalcul
        size={size}
        calcul={calcul}
        unite={unite}
      />
    </div>
  );
};

const formatValeur = (valeur: number | null, unite: string) =>
  `${valeur === null ? '--' : toLocaleFixed(valeur, 2)} ${unite}`;

/** Bornes de la jauge, selon le type de calcul du score */
const SubactionIndicateurScoreCalcul = ({
  calcul,
  unite,
  size,
}: {
  calcul: CalculScoreIndicatif | null;
  unite: string;
  size: 'sm' | 'md';
}) => {
  switch (calcul?.type) {
    case 'presence_absence':
      return (
        <CalculLigne
          size={size}
          gauche={appLabels.scoreIndicatifPasDeDonnee}
          droite={appLabels.scoreIndicatifDonneeRenseignee}
        />
      );
    case 'presence_absence_positif':
      return (
        <CalculLigne
          size={size}
          gauche={appLabels.scoreIndicatifPasDeDonnee}
          droite={appLabels.scoreIndicatifDonneeRenseigneePositive}
        />
      );
    case 'valeur_cible_seuil':
      return (
        <CalculLigne
          size={size}
          gauche={`${appLabels.sourceSeuilMin} : ${formatValeur(
            calcul.seuil,
            unite
          )}`}
          droite={`${appLabels.sourceCibleMin} : ${formatValeur(
            calcul.cible,
            unite
          )}`}
        />
      );
    case 'progression_snbc':
      return (
        <CalculLigne
          size={size}
          gauche={appLabels.scoreIndicatifReference(
            formatValeur(calcul.objectifSnbcDepart, unite),
            appLabels.scoreIndicatifAnneeSnbc(calcul.anneeDepart)
          )}
          droite={
            calcul.anneeUtilisee === null
              ? appLabels.scoreIndicatifCibleSelonResultat
              : appLabels.scoreIndicatifCible(
                  formatValeur(calcul.objectifSnbc, unite),
                  appLabels.scoreIndicatifAnneeSnbc(calcul.anneeUtilisee)
                )
          }
        />
      );
    case 'reduction':
      return (
        <>
          <CalculLigne
            size={size}
            gauche={appLabels.scoreIndicatifReference(
              formatValeur(calcul.resultatDepart, unite),
              String(calcul.anneeDepart)
            )}
            droite={
              calcul.anneeUtilisee === null
                ? appLabels.scoreIndicatifCibleSelonResultat
                : appLabels.scoreIndicatifCible(
                    formatValeur(calcul.valeurCible, unite),
                    String(calcul.anneeUtilisee)
                  )
            }
          />
          {size === 'md' && (
            <p className="mb-0 text-xs text-grey-7 text-right">
              {appLabels.scoreIndicatifReductionCible(
                toLocaleFixed(calcul.reductionCible * 100, 1),
                calcul.anneeCible
              )}
            </p>
          )}
        </>
      );
    default:
      return null;
  }
};

const CalculLigne = ({
  gauche,
  droite,
  size,
}: {
  gauche: string;
  droite: string;
  size: 'sm' | 'md';
}) => (
  <div
    className={cn('flex items-baseline justify-between', {
      'text-sm': size === 'md',
      'text-xs': size === 'sm',
    })}
  >
    <span>{gauche}</span>
    <span className="text-right">{droite}</span>
  </div>
);
