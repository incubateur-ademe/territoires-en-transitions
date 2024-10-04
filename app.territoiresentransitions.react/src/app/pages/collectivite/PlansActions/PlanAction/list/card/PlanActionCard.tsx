import { Axe } from '@tet/api/plan-actions/domain';
import { generateTitle } from '@tet/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import Statuts from '@tet/app/pages/collectivite/PlansActions/PlanAction/list/card/Statuts';
import { ModuleDisplay } from '@tet/app/pages/collectivite/TableauDeBord/components/Module';
import { useFichesActionStatuts } from '@tet/app/pages/collectivite/TableauDeBord/Collectivite/ModuleAvancementFichesAction/useFichesActionStatuts';
import { Card } from '@tet/ui';
import { useHistory } from 'react-router-dom';

type Props = {
  /** Plan d'action */
  plan: Axe;
  /** Lien vers la fiche action */
  link?: string;
  /** Doit ouvrir la fiche action dans un nouvel onglet */
  openInNewTab?: boolean;
  /** Gère l'affichage des statuts des fiches */
  display?: ModuleDisplay;
};

/** Carte résumé d'un plan d'action */
const PlanActionCard = ({
  plan,
  link,
  openInNewTab,
  display = 'row',
}: Props) => {
  const history = useHistory();

  const { data } = useFichesActionStatuts({
    plan_ids: plan.id.toString(),
  });

  const statuts = data?.par_statut;

  const count = plan.axes?.reduce(
    (acc: { axe: number; sousAxe: number }, axe: Axe) => {
      if (axe.parent === plan.id) {
        acc.axe++;
      } else {
        acc.sousAxe++;
      }
      return acc;
    },
    { axe: 0, sousAxe: 0 }
  );

  const fichesCount = statuts
    ? Object.values(statuts).reduce((acc, curr) => acc + curr.count, 0)
    : 0;

  return (
    <Card
      href={link}
      external={openInNewTab}
      className="gap-0 !p-4 hover:bg-white"
    >
      {/** Nom */}
      <span className="mb-2 font-bold text-primary-9">
        {generateTitle(plan.nom)}
      </span>
      {/** Type */}
      {/** TODO : Afficher le vrai type de plan en adaptant au nouveaux types */}
      {(plan.type || true) && (
        <span className="text-sm font-medium text-grey-8 uppercase">
          {/* {plan.type.type} */}
          Fake Type
        </span>
      )}
      {/** Statuts de fiches */}
      {statuts && (
        <Statuts
          statuts={statuts}
          fichesCount={fichesCount}
          display={display}
        />
      )}
      <div className="flex items-center gap-2 text-sm font-normal text-grey-8">
        {/** Nombre d'axes */}
        <span>
          {count?.axe ?? 0} axe{count && count.axe > 1 ? 's' : ''}
        </span>
        <div className="w-0.5 h-4/5 my-auto bg-grey-5" />
        {/** Nombre de sous-axes */}
        <span>
          {count?.sousAxe ?? 0} sous-axe{count && count.sousAxe > 1 ? 's' : ''}
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

export default PlanActionCard;
