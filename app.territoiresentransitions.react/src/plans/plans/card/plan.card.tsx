import classNames from 'classnames';

import { useFichesCountBy } from '@/app/plans/fiches/_data/use-fiches-count-by';
import { Statuts } from '@/app/plans/plans/card/statuts';
import { Axe, Statut } from '@/domain/plans/fiches';
import { CountByRecordType } from '@/domain/utils';
import { Card } from '@/ui';
import { generateTitle } from '@/app/plans/utils';

export type PlanCardDisplay = 'circular' | 'row';

type Props = {
  /** Plan d'action */
  plan: Axe;
  /** Lien vers la fiche action */
  link?: string;
  /** Doit ouvrir la fiche action dans un nouvel onglet */
  openInNewTab?: boolean;
  /** Gère l'affichage des statuts des fiches */
  display?: PlanCardDisplay;
};

/** Carte résumé d'un plan d'action */
const PlanCard = ({ plan, link, openInNewTab, display = 'row' }: Props) => {
  const { data: countByResponse } = useFichesCountBy('statut', {
    planActionIds: [plan.id],
  });

  const axesCount = plan.axes?.reduce(
    (
      acc: { axe: number; sousAxe: number },
      axe: NonNullable<Axe['axes']>[number]
    ) => {
      if (axe.parent === plan.id) {
        acc.axe++;
      } else if (axe.parent) {
        acc.sousAxe++;
      }
      return acc;
    },
    { axe: 0, sousAxe: 0 }
  );

  const fichesCount = countByResponse?.total || 0;

  return (
    <Card
      href={link}
      external={openInNewTab}
      className="justify-between gap-0 !p-4 hover:bg-white"
    >
      <div className="flex flex-col gap-2">
        {/** Nom */}
        <span className="font-bold text-primary-9">
          {generateTitle(plan.nom)}
        </span>
        {/** Type */}
        {plan.type && (
          <span className="text-sm font-medium text-grey-8 uppercase">
            {plan.type.type}
          </span>
        )}
      </div>
      {/** Statuts de fiches */}
      {countByResponse?.countByResult && (
        <Statuts
          statuts={countByResponse.countByResult as CountByRecordType<Statut>}
          fichesCount={fichesCount}
          display={display}
        />
      )}
      <div
        className={classNames(
          'flex items-center gap-2 text-sm font-normal text-grey-8',
          {
            'pt-4 border-t border-grey-3': display === 'circular',
          }
        )}
      >
        {/** Nombre d'axes */}
        <span>
          {axesCount?.axe ?? 0} axe{axesCount && axesCount.axe > 1 ? 's' : ''}
        </span>
        <div className="w-0.5 h-4/5 my-auto bg-grey-5" />
        {/** Nombre de sous-axes */}
        <span>
          {axesCount?.sousAxe ?? 0} sous-axe
          {axesCount && axesCount.sousAxe > 1 ? 's' : ''}
        </span>
        <div className="w-0.5 h-4/5 my-auto bg-grey-5" />
        {/** Nombre de fiches */}
        <span>
          {fichesCount ?? 0} fiche{fichesCount > 1 ? 's' : ''}
        </span>
      </div>
    </Card>
  );
};

export default PlanCard;
