'use client';

import {
  MetadataItem,
  MetadataItemPersonne,
  MetadataItemProps,
  MetadataLine,
} from '@/app/ui/metadata-line';
import { AggregatedBudget } from '@tet/domain/plans';
import { InlineEditWrapper, Select, Tooltip } from '@tet/ui';
import { plural } from '@tet/ui/labels/plural';
import { countBy } from 'es-toolkit';
import { EditableTitle } from '../../fiches/show-fiche/header/editable-title';
import FranceIcon from '../components/france-icon.svg';
import { useListPlanTypes } from '../use-list-plan-types';
import { usePlanAxesContext } from './plan-arborescence.view/plan-axes.context';
import { PlanMenuButton } from './plan-menu.button';
import { PlanStatus } from './plan-status.chart';

export const PlanHeader = () => {
  const { plan, rootAxe, isReadOnly, updatePlan } = usePlanAxesContext();
  const { id, collectiviteId } = plan;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <EditableTitle
          className="text-2xl w-5/6"
          inputClassName="text-2xl"
          dataTest="plan-editable-title"
          isReadonly={isReadOnly}
          title={rootAxe.nom}
          onUpdate={(value) => {
            updatePlan({ id, collectiviteId, nom: value });
          }}
        />
        <PlanMenuButton />
      </div>
      <div className="flex flex-col gap-2">
        <PlanMetadata />
        <PlanStatus planId={plan.id} />
      </div>
    </div>
  );
};

const PlanMetadata = () => {
  const { plan, isReadOnly, updatePlan } = usePlanAxesContext();
  const { options: planTypesOptions } = useListPlanTypes();
  const { id, collectiviteId } = plan;
  const axesCountByType = countBy(plan.axes, (axe) =>
    axe.depth === 0 ? 'root' : axe.depth > 1 ? 'sousAxe' : 'axe'
  );

  return (
    <div>
      <MetadataLine>
        {/** Type de plan */}
        <InlineEditWrapper
          disabled={isReadOnly}
          renderOnEdit={({ openState }) => {
            return (
              <Select
                dataTest="plan-type-edit"
                options={planTypesOptions ?? []}
                values={plan.type?.id ?? undefined}
                onChange={(value) => {
                  updatePlan({
                    id,
                    collectiviteId,
                    typeId: value ? (value as number) : null,
                  });
                }}
                openState={openState}
              />
            );
          }}
        >
          <MetadataItem
            interactive={!isReadOnly}
            icon="folder-2-line"
            label="Type"
            value={plan.type?.type}
            dataTest="plan-header-type"
          />
        </InlineEditWrapper>
        {/** Pilotes */}
        <MetadataItemPersonne
          dataTest="plan-header-pilote"
          icon="user-line"
          isReadOnly={isReadOnly}
          label={{ one: 'Pilote', many: 'Pilotes' }}
          personnes={plan.pilotes}
          onChange={(pilotes) => updatePlan({ id, collectiviteId, pilotes })}
        />
        {/** Référents */}
        <MetadataItemPersonne
          dataTest="plan-header-referent"
          icon={<FranceIcon />}
          isReadOnly={isReadOnly}
          label={{ one: 'Élu·e référent·e', many: 'Élu·es référent·es' }}
          personnes={plan.referents}
          onChange={(referents) =>
            updatePlan({ id, collectiviteId, referents })
          }
        />
        {/** Budget */}
        <PlanBudgetItem
          dataTest="plan-header-investissement"
          icon="bank-line"
          label="Budget d'investissement"
          budget={plan.budget?.investissement?.HT.budgetReel}
          totalFiches={plan.totalFiches}
        />
        <PlanBudgetItem
          dataTest="plan-header-fonctionnement"
          hideSeparator
          icon="money-euro-circle-line"
          label="Budget de fonctionnement"
          budget={plan.budget?.fonctionnement?.HT.budgetReel}
          totalFiches={plan.totalFiches}
        />
      </MetadataLine>
      {/** Compteurs axes/actions */}
      <MetadataLine className="text-grey-8">
        <MetadataItem
          dataTest="plan-header-axes"
          icon="git-commit-line"
          label={plural({ one: 'Axe', other: 'Axes' })({
            count: axesCountByType.axe || 0,
          })}
          value={axesCountByType.axe || 0}
        />
        <MetadataItem
          dataTest="plan-header-sous-axes"
          icon="git-merge-line"
          label={plural({ one: 'Sous-axe', other: 'Sous-axes' })({
            count: axesCountByType.sousAxe || 0,
          })}
          value={axesCountByType.sousAxe || 0}
        />
        <MetadataItem
          dataTest="plan-header-actions"
          hideSeparator
          icon="file-text-line"
          label={plural({ one: 'Action', other: 'Actions' })({
            count: plan.totalFiches ?? 0,
          })}
          value={plan.totalFiches}
        />
      </MetadataLine>
    </div>
  );
};

const PlanBudgetItem = ({
  dataTest,
  hideSeparator,
  icon,
  label,
  budget,
  totalFiches,
}: Pick<MetadataItemProps, 'hideSeparator' | 'icon' | 'label' | 'dataTest'> & {
  budget: AggregatedBudget | undefined;
  totalFiches: number | undefined;
}) => {
  const formattedBudget = budget && formatBudget(budget.total);

  return (
    <Tooltip
      className="whitespace-break-spaces"
      label={
        formattedBudget
          ? `Le budget total est calculé sur la base de ${budget.nbFiches}/${totalFiches} actions.\nLes actions sans budget dépensé HT renseigné ne sont pas incluses dans ce calcul.`
          : 'Complétez les budgets dépensés HT dans les actions pour voir le total ici.'
      }
    >
      <MetadataItem
        dataTest={dataTest}
        hideSeparator={hideSeparator}
        icon={icon}
        label={label}
        value={formattedBudget}
      />
    </Tooltip>
  );
};

function formatBudget(budget?: number): string {
  return budget ? BUDGET_FORMATTER.format(budget) : '';
}

const BUDGET_FORMATTER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  notation: 'standard',
});
