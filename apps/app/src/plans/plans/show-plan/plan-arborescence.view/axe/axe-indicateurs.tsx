import IndicateurCard, {
  IndicateurCardProps,
} from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useIntersectionObserver } from '@/app/utils/useIntersectionObserver';
import { Button } from '@tet/ui';
import { PlanDisplayOptionsEnum } from '../plan-options.context';
import { AxeSectionTitle } from './axe-section-title';
import { useAxeContext } from './axe.context';

export const AxeIndicateurs = () => {
  const {
    planOptions,
    isOpen,
    isReadOnly,
    selectedIndicateurs,
    toggleIndicateur,
    providerProps,
  } = useAxeContext();
  const { collectivite } = providerProps;
  const isEditable = hasPermission(
    collectivite.permissions,
    'indicateurs.indicateurs.update'
  );

  if (
    !isOpen ||
    !planOptions.isOptionEnabled(PlanDisplayOptionsEnum.INDICATEURS) ||
    !selectedIndicateurs?.length
  ) {
    return null;
  }

  const hideChart = !planOptions.isOptionEnabled(
    PlanDisplayOptionsEnum.GRAPHIQUE_INDICATEURS
  );

  return (
    <section>
      <AxeSectionTitle name="indicateurs" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 pt-4">
        {selectedIndicateurs.map((indicateur) => {
          return (
            <IndicateurChartContainer
              key={`${indicateur.id}-${indicateur.titre}`}
              definition={indicateur}
              collectiviteId={collectivite.collectiviteId}
              isReadOnly={isReadOnly}
              isEditable={isEditable}
              hideChart={hideChart}
              selectState={{
                selected: true,
                setSelected: (indicateur) => toggleIndicateur(indicateur),
              }}
            />
          );
        })}
      </div>
    </section>
  );
};

/** Affiche le graphique uniquement lorsque son conteneur devient visible */
const IndicateurChartContainer = (
  props: IndicateurCardProps & {
    isReadOnly: boolean;
    collectiviteId: number;
  }
) => {
  const { ref, entry } = useIntersectionObserver();

  const {
    definition,
    hideChart,
    isEditable,
    isReadOnly,
    collectiviteId,
    selectState,
  } = props;

  return (
    <div className="h-full" ref={ref}>
      {entry?.isIntersecting ? (
        <IndicateurCard
          key={`${definition.id}-${definition.titre}`}
          readonly={isReadOnly}
          isEditable={isEditable}
          definition={definition}
          externalCollectiviteId={collectiviteId}
          hideChart={hideChart}
          href={makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: getIndicateurGroup(
              definition.identifiantReferentiel
            ),
            indicateurId: definition.id,
            identifiantReferentiel: definition.identifiantReferentiel,
          })}
          selectState={selectState}
          otherMenuActions={
            isReadOnly
              ? undefined
              : (indicateur) => [
                  <Button
                    key={indicateur.id}
                    onClick={() => selectState?.setSelected(indicateur)}
                    icon="link-unlink"
                    title="Dissocier l'indicateur"
                    size="xs"
                    variant="grey"
                  />,
                ]
          }
        />
      ) : (
        definition.titre
      )}
    </div>
  );
};
