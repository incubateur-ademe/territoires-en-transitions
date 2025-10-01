import classNames from 'classnames';

import { useFichesCountBy } from '@/app/plans/fiches/data/use-fiches-count-by';
import { PiloteOrReferentLabel } from '@/app/plans/plans/components/PiloteOrReferentLabel';
import { Statut } from '@/domain/plans/fiches';
import { Plan } from '@/domain/plans/plans';
import { CountByRecordType } from '@/domain/utils';
import { Card, VisibleWhen } from '@/ui';
import { Statuts } from './statuts';

export type PlanCardDisplay = 'circular' | 'row';

type Props = {
  /** Plan d'action */
  plan: Plan;
  /** Lien vers la fiche action */
  link?: string;
  /** Doit ouvrir la fiche action dans un nouvel onglet */
  openInNewTab?: boolean;
  /** Gère l'affichage des statuts des fiches */
  display?: PlanCardDisplay;
};

/** Carte résumé d'un plan d'action */
export const PlanCard = ({
  plan,
  link,
  openInNewTab,
  display = 'row',
}: Props) => {
  const { data: countByResponse, isLoading } = useFichesCountBy('statut', {
    planActionIds: [plan.id],
  });

  const axesCount = plan.axes?.reduce(
    (
      acc: { axe: number; sousAxe: number },
      axe: NonNullable<Plan['axes']>[number]
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
      className="gap-2 !p-4 hover:bg-white"
    >
      <span className="font-bold text-primary-9">
        {plan.nom ?? 'Sans titre'}
      </span>
      <span className="text-sm font-medium text-grey-8 uppercase">
        {plan.type?.type ?? 'Sans type'}
      </span>
      <div className="mb-auto">
        <Statuts
          statuts={
            countByResponse?.countByResult as
              | CountByRecordType<Statut>
              | undefined
          }
          fichesCount={fichesCount}
          display={display}
          isLoading={isLoading}
        />
      </div>
      <VisibleWhen condition={plan.pilotes.length > 0}>
        <div className="flex items-center gap-2">
          <PiloteOrReferentLabel icon="pilote" personnes={plan.pilotes} />
        </div>
      </VisibleWhen>
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
