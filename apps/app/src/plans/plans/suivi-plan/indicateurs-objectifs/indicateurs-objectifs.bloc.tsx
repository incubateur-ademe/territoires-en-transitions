'use client';

import {
  getPersonneStringId,
  isMembre,
} from '@/app/collectivites/tags/personnes.utils';
import { usePersonneListe } from '@/app/collectivites/tags/use-list-personnes';
import { useListServices } from '@/app/collectivites/tags/use-list-services';
import { appLabels } from '@/app/labels/catalog';
import { useGetThematiqueOptions } from '@/app/shared/thematiques/use-get-thematique-and-sous-thematique-options';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  getHorizonParDefaut,
  INDICATEURS_OBJECTIFS_HORIZONS,
  PlanNode,
} from '@tet/domain/plans';
import {
  Alert,
  Button,
  ButtonGroup,
  Icon,
  SearchCombobox,
  type SearchComboboxSelection,
} from '@tet/ui';
import {
  parseAsNumberLiteral,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useMemo, useRef, useState } from 'react';
import { useUpdateIndicateursObjectifsOrdre } from '../data/use-update-indicateurs-objectifs-ordre';
import { useExportIndicateursObjectifs } from '../data/use-export-indicateurs-objectifs';
import { useGetIndicateursObjectifs } from '../data/use-get-indicateurs-objectifs';
import { ExportBlocButton } from '../export-bloc.button';
import { SuiviPlanBloc } from '../suivi-plan.bloc';
import { SuiviPlanFilterBadges } from '../suivi-plan-filter-badges';
import { SuiviPlanFiltersButton } from '../suivi-plan-filters.button';
import { useSuiviPlanBlocFilters } from '../use-suivi-plan-bloc-filters';
import { IndicateurObjectifCard } from './indicateur-objectif.card';
import { IndicateurObjectifSortable } from './indicateur-objectif.sortable';
import {
  buildSearchSuggestions,
  filterIndicateursObjectifs,
  FILTRE_PREFIXES,
  INDICATEURS_OBJECTIFS_FILTRES_SOURCE,
  IndicateursObjectifsFiltreSource,
  parseSuggestionFiltre,
} from './search-indicateurs-objectifs';

const NB_INDICATEURS_VISIBLES = 6;

const FILTRE_SOURCE_LABELS: Record<IndicateursObjectifsFiltreSource, string> = {
  tous: appLabels.indicateursObjectifsAfficherTous,
  reglementaires: appLabels.indicateursObjectifsAfficherReglementaires,
  plan: appLabels.indicateursObjectifsAfficherPlan,
};

const uniques = (values: number[]) => [...new Set(values)];

export const IndicateursObjectifsBloc = ({
  collectiviteId,
  planId,
  axes,
}: {
  collectiviteId: number;
  planId: number;
  axes: PlanNode[];
}) => {
  const filters = useSuiviPlanBlocFilters('indicateursObjectifsFiltres');
  const { data: indicateurs, isError } = useGetIndicateursObjectifs({
    planId,
    ...filters.queryInput,
  });
  // la présence des réglementaires se lit sans filtre : un filtre ne doit pas
  // faire disparaître le contrôle « Afficher » ni réinitialiser sa source
  const { data: indicateursSansFiltre } = useGetIndicateursObjectifs({
    planId,
  });
  const { data: personnes } = usePersonneListe();
  const { data: services } = useListServices();
  const { thematiqueListe } = useGetThematiqueOptions();
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canMutateValeurs = hasCollectivitePermission(
    'indicateurs.valeurs.mutate'
  );

  const [horizon, setHorizon] = useQueryState(
    'indicateursHorizon',
    parseAsNumberLiteral(INDICATEURS_OBJECTIFS_HORIZONS).withDefault(
      getHorizonParDefaut(new Date().getFullYear())
    )
  );
  const [source, setSource] = useQueryState(
    'indicateursSource',
    parseAsStringLiteral(INDICATEURS_OBJECTIFS_FILTRES_SOURCE).withDefault(
      'tous'
    )
  );
  const [recherche, setRecherche] = useState('');
  const [selectionIds, setSelectionIds] = useState<number[]>([]);
  const [isAllVisible, setIsAllVisible] = useState(false);
  const blocRef = useRef<HTMLElement>(null);
  const { mutate: exportExcel, isPending: isExportingExcel } =
    useExportIndicateursObjectifs();
  const { mutate: updateOrdre, isPending: isOrdreEnregistrement } =
    useUpdateIndicateursObjectifsOrdre();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getSuggestions = useMemo(
    () =>
      indicateurs
        ? buildSearchSuggestions({
            indicateurs,
            axes,
            pilotes: (personnes ?? []).filter(isMembre).map((personne) => ({
              id: getPersonneStringId(personne),
              nom: personne.nom,
            })),
            services: (services ?? []).map(({ id, nom }) => ({
              id: String(id),
              nom,
            })),
            thematiques: thematiqueListe.map(({ id, nom }) => ({
              id: String(id),
              nom,
            })),
          })
        : undefined,
    [indicateurs, axes, personnes, services, thematiqueListe]
  );
  // badges et filtre de source n'ont de sens que pour un plan du dépôt PCAET
  const hasReglementaires =
    indicateursSansFiltre?.some(({ sources }) =>
      sources.includes('reglementaire')
    ) ?? false;
  const filtres = indicateurs
    ? filterIndicateursObjectifs(indicateurs, {
        recherche,
        selectionIds,
        source: hasReglementaires ? source : 'tous',
      })
    : [];
  const visibles = isAllVisible
    ? filtres
    : filtres.slice(0, NB_INDICATEURS_VISIBLES);
  const nbMasques = filtres.length - NB_INDICATEURS_VISIBLES;

  const selections: SearchComboboxSelection[] = selectionIds.map((id) => ({
    id: String(id),
    label: indicateurs?.find((indicateur) => indicateur.id === id)?.titre ?? '',
  }));
  const toggleSelection = (id: number) =>
    setSelectionIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
    );

  // on ne réordonne que la liste entière : un filtre, une recherche ou une
  // source partielle n'en montrerait qu'un sous-ensemble
  // un réordonnancement à la fois : le suivant part de l'ordre enregistré
  const canReorder =
    hasCollectivitePermission('plans.mutate') &&
    !isOrdreEnregistrement &&
    filters.filtersCount === 0 &&
    recherche === '' &&
    selectionIds.length === 0 &&
    (!hasReglementaires || source === 'tous');

  // les cartes masquées par « voir plus » doivent pouvoir servir de cible
  const onDragStart = () => setIsAllVisible(true);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!indicateurs || !over || active.id === over.id) {
      return;
    }
    const ids = indicateurs.map(({ id }) => id);
    const nouvelOrdre = arrayMove(
      ids,
      ids.indexOf(Number(active.id)),
      ids.indexOf(Number(over.id))
    );
    updateOrdre({ planId, indicateurIds: nouvelOrdre });
  };

  // un critère cherché pose ou retire le filtre correspondant du bloc
  const toggleFiltre = (id: string, pose: boolean) => {
    const filtre = parseSuggestionFiltre(id);
    if (!filtre) {
      return;
    }
    const { prefixe, valeur } = filtre;
    const ajoute = <T,>(values: T[], value: T) =>
      pose
        ? (uniques([...values, value] as never[]) as T[])
        : values.filter((item) => item !== value);
    if (prefixe === FILTRE_PREFIXES.axe) {
      filters.setAxeIds(ajoute(filters.axeIds, Number(valeur)));
    } else if (prefixe === FILTRE_PREFIXES.service) {
      filters.setServicePiloteIds(
        ajoute(filters.servicePiloteIds, Number(valeur))
      );
    } else if (prefixe === FILTRE_PREFIXES.thematique) {
      filters.setThematiqueIds(ajoute(filters.thematiqueIds, Number(valeur)));
    } else if (prefixe === FILTRE_PREFIXES.pilote) {
      filters.setFormFilters({
        ...filters.formFilters,
        pilotes: ajoute(filters.formFilters.pilotes ?? [], valeur),
      });
    }
    setRecherche('');
  };

  return (
    <SuiviPlanBloc
      titre={appLabels.indicateursObjectifsTitre}
      dataTest="plans.suivi.indicateurs-objectifs"
      ref={blocRef}
      filterBadges={<SuiviPlanFilterBadges filters={filters} axes={axes} />}
      actions={
        <>
          <SuiviPlanFiltersButton
            filters={filters}
            axes={axes}
            withServicesPilotes
            dataTest="plans.suivi.indicateurs-objectifs.filtres"
          />
          <div className="flex items-center gap-2 text-sm text-grey-8">
            {appLabels.indicateursObjectifsHorizon}
            <ButtonGroup
              size="sm"
              label={appLabels.indicateursObjectifsHorizon}
              activeButtonId={String(horizon)}
              buttons={INDICATEURS_OBJECTIFS_HORIZONS.map((annee) => ({
                id: String(annee),
                children: String(annee),
                onClick: () => setHorizon(annee),
                'data-test': `plans.suivi.indicateurs-objectifs.horizon-${annee}`,
              }))}
            />
          </div>
          <ExportBlocButton
            blocRef={blocRef}
            fileName={appLabels.indicateursObjectifsTitre}
            onExportExcel={() =>
              exportExcel({
                ...filters.queryInput,
                planId,
                horizon,
                source: hasReglementaires ? source : 'tous',
              })
            }
            isExportingExcel={isExportingExcel}
            dataTest="plans.suivi.indicateurs-objectifs.exporter"
          />
        </>
      }
    >
      {isError ? (
        <Alert
          state="error"
          title={appLabels.indicateursObjectifsErreurChargement}
        />
      ) : indicateurs === undefined ? (
        <div className="flex justify-center p-12">
          <Icon icon="loader-4-line" className="animate-spin text-grey-6" />
        </div>
      ) : indicateurs.length === 0 ? (
        <p className="mb-0 text-sm text-grey-8">
          {appLabels.indicateursObjectifsAucun}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className="flex flex-wrap items-center gap-x-6 gap-y-3"
            data-html2canvas-ignore
          >
            <SearchCombobox
              label={appLabels.indicateursObjectifsRecherche}
              placeholder={appLabels.indicateursObjectifsRecherche}
              value={recherche}
              onSearch={(value) => {
                setRecherche(value);
                setIsAllVisible(false);
              }}
              debounce={200}
              getSuggestions={getSuggestions}
              isOptionSelected={(option) =>
                selectionIds.includes(Number(option.id))
              }
              onSelectOption={(option) =>
                parseSuggestionFiltre(option.id)
                  ? toggleFiltre(option.id, true)
                  : toggleSelection(Number(option.id))
              }
              onDeselectOption={(option) =>
                parseSuggestionFiltre(option.id)
                  ? toggleFiltre(option.id, false)
                  : toggleSelection(Number(option.id))
              }
              selections={selections}
              onRemoveSelection={(id) => toggleSelection(Number(id))}
              fieldClassName="w-full sm:w-[28rem]"
              data-test="plans.suivi.indicateurs-objectifs.recherche"
            />
            {hasReglementaires && (
              <div className="flex items-center gap-2 text-sm text-grey-8">
                {appLabels.indicateursObjectifsAfficher}
                <ButtonGroup
                  size="xs"
                  label={appLabels.indicateursObjectifsAfficher}
                  activeButtonId={source}
                  buttons={INDICATEURS_OBJECTIFS_FILTRES_SOURCE.map(
                    (filtre) => ({
                      id: filtre,
                      children: FILTRE_SOURCE_LABELS[filtre],
                      onClick: () => {
                        setSource(filtre);
                        setIsAllVisible(false);
                      },
                      'data-test': `plans.suivi.indicateurs-objectifs.afficher-${filtre}`,
                    })
                  )}
                />
              </div>
            )}
          </div>

          {filtres.length === 0 ? (
            <p className="mb-0 text-sm text-grey-8">
              {appLabels.indicateursObjectifsAucunRecherche}
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={visibles.map(({ id }) => id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibles.map((indicateur) => (
                    <IndicateurObjectifSortable
                      key={indicateur.id}
                      id={indicateur.id}
                      isEnabled={canReorder}
                      renderCard={(poignee) => (
                        <IndicateurObjectifCard
                          collectiviteId={collectiviteId}
                          indicateur={indicateur}
                          horizon={horizon}
                          canMutateValeurs={canMutateValeurs}
                          showSources={hasReglementaires}
                          poignee={poignee}
                        />
                      )}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {nbMasques > 0 && (
            <Button
              variant="unstyled"
              size="sm"
              className="flex items-center gap-1 self-start text-sm text-primary-9"
              icon={isAllVisible ? 'arrow-up-s-line' : 'arrow-down-s-line'}
              iconPosition="right"
              onClick={() => setIsAllVisible((visible) => !visible)}
              dataTest="plans.suivi.indicateurs-objectifs.voir-plus"
              data-html2canvas-ignore
            >
              {isAllVisible
                ? appLabels.indicateursObjectifsVoirMoins
                : appLabels.indicateursObjectifsVoirPlus(nbMasques)}
            </Button>
          )}
        </div>
      )}
    </SuiviPlanBloc>
  );
};
