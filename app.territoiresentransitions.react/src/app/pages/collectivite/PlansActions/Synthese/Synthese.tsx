import {StatusColor} from 'ui/charts/chartsTheme';
import TagFilters from 'ui/shared/filters/TagFilters';
import HeaderTitle from '../components/HeaderTitle';
import {usePlansActionsListe} from '../PlanAction/data/usePlansActionsListe';
import SyntheseCard from './SyntheseCard';

type SyntheseProps = {
  collectiviteId: number;
};

const Synthese = ({collectiviteId}: SyntheseProps): JSX.Element => {
  const data = usePlansActionsListe(collectiviteId);

  return (
    <div className="w-full">
      <HeaderTitle
        type="plan"
        titre="Synthèse des fiches action"
        isReadonly={true}
      />
      <div className="max-w-4xl mx-auto px-10">
        {/* Filtres par plan d'actions */}
        {data && data.plans.length > 0 && (
          <TagFilters
            name="test"
            options={[
              ...data.plans.map(plan =>
                plan.nom && plan.nom.length >= 0 ? plan.nom : 'Sans titre'
              ),
              'Fiches non classées',
            ]}
            defaultOption={'Toutes les fiches'}
            className="py-10"
            onChange={value => console.log(value)}
          />
        )}

        {/* Graphes répartition des fiches */}
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-sm-12 fr-col-xl-6">
            <SyntheseCard
              title="Répartition par statut d'avancement"
              data={[
                {id: 'En cours', value: 10, color: StatusColor['En cours']},
                {id: 'En pause', value: 30, color: StatusColor['En pause']},
                {id: 'A venir', value: 60, color: StatusColor['A venir']},
                {id: 'Réalisé', value: 15, color: StatusColor['Réalisé']},
                {id: 'Abandonnée', value: 10, color: StatusColor['Abandonné']},
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Synthese;
