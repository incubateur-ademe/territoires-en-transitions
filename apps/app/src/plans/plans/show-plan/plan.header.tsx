'use client';
import { usePlanTypeListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanTypeListe';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { Personne } from '@tet/domain/collectivites';
import { AggregatedBudget } from '@tet/domain/plans';
import {
  cn,
  Icon,
  IconValue,
  InlineEditWrapper,
  Select,
  Tooltip,
} from '@tet/ui';
import { countBy } from 'es-toolkit';
import { ReactNode } from 'react';
import { EditableTitle } from '../../fiches/show-fiche/header/editable-title';
import FranceIcon from '../components/france-icon.svg';
import { usePlanAxesContext } from './plan-arborescence.view/plan-axes.context';
import { PlanMenuButton } from './plan-menu.button';
import { PlanStatus } from './plan-status.chart';

export const PlanHeader = () => {
  const { plan, rootAxe, isReadOnly, updatePlan } = usePlanAxesContext();
  const { id, collectiviteId } = plan;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <EditableTitle
          className="text-2xl leading-10 my-0"
          containerClassName="mb-0 items-center [&_button]:mt-0 [&_input]:py-0"
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
  const { options: planTypesOptions } = usePlanTypeListe();
  const { id, collectiviteId } = plan;
  const nbAxes = countBy(plan.axes, (axe) =>
    axe.depth === 0 ? 'isRoot' : axe.depth > 1 ? 'isChild' : 'isParent'
  );

  return (
    <div>
      <PlanMetadataLine>
        {/** Type de plan */}
        <InlineEditWrapper
          disabled={isReadOnly}
          renderOnEdit={({ openState }) => {
            return (
              <Select
                containerWidthMatchButton={false}
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
          <PlanMetadataItem
            interactive
            icon="folder-2-line"
            label="Type"
            value={plan.type?.type}
          />
        </InlineEditWrapper>
        {/** Pilotes */}
        <PlanMetadataItemPersonne
          icon="user-line"
          isReadOnly={isReadOnly}
          label={{ one: 'Pilote', many: 'Pilotes' }}
          personnes={plan.pilotes}
          onChange={(pilotes) => updatePlan({ id, collectiviteId, pilotes })}
        />
        {/** Référents */}
        <PlanMetadataItemPersonne
          icon={<FranceIcon />}
          isReadOnly={isReadOnly}
          label={{ one: 'Élu·e référent·e', many: 'Élu·es référent·es' }}
          personnes={plan.referents}
          onChange={(referents) =>
            updatePlan({ id, collectiviteId, referents })
          }
        />
        {/** Budget */}
        <PlanMetadataItemBudget
          icon="bank-line"
          label="Budget d'investissement"
          budget={plan.budget?.investissement?.HT.budgetReel}
          totalFiches={plan.totalFiches}
        />
        <PlanMetadataItemBudget
          hideSeparator
          icon="money-euro-circle-line"
          label="Budget de fonctionnement"
          budget={plan.budget?.fonctionnement?.HT.budgetReel}
          totalFiches={plan.totalFiches}
        />
      </PlanMetadataLine>
      {/** Compteurs axes/actions */}
      <PlanMetadataLine>
        <PlanMetadataItem
          icon="git-commit-line"
          label={{ one: 'Axe', many: 'Axes' }}
          value={nbAxes.isParent}
        />
        <PlanMetadataItem
          icon="git-merge-line"
          label={{ one: 'Sous-axe', many: 'Sous-axes' }}
          value={nbAxes.isChild}
        />
        <PlanMetadataItem
          hideSeparator
          icon="file-text-line"
          label={{ one: 'Action', many: 'Actions' }}
          value={plan.totalFiches}
        />
      </PlanMetadataLine>
    </div>
  );
};

const PlanMetadataLine = ({ children }: { children: ReactNode[] }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-0 items-center text-sm leading-5 text-primary-9">
    {children}
  </div>
);

type PlanMetadataItemProps = {
  interactive?: boolean;
  hideSeparator?: boolean;
  icon: IconValue;
  label: string | { one: string; many: string };
  value: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

const PlanMetadataItem = ({
  interactive = false,
  hideSeparator = false,
  icon,
  label,
  value,
  ...props
}: PlanMetadataItemProps) => {
  // `{...props}` est nécessaire pour permettre le passage des props injectées par `InlineEditWrapper`
  return (
    <div {...props} className={cn(props.className, 'flex items-center')}>
      <div
        className={cn('flex items-center gap-2 py-1.5', {
          'hover:bg-grey-3 rounded px-2 -mx-2': interactive,
        })}
      >
        <Icon icon={icon} />
        <span className="font-normal">
          {typeof label === 'string'
            ? label
            : typeof value === 'number' && value > 0
            ? label.many
            : label.one}{' '}
          :{' '}
        </span>
        {value ? (
          <span className="font-medium">{value}</span>
        ) : (
          <span className="text-warning-1">À compléter</span>
        )}
      </div>
      {!hideSeparator && <div className="ml-4 w-[1px] h-4 bg-primary-3" />}
    </div>
  );
};

const PlanMetadataItemPersonne = ({
  icon,
  isReadOnly,
  label,
  personnes,
  onChange,
}: {
  icon: IconValue;
  isReadOnly: boolean;
  label: { one: string; many: string };
  personnes: Personne[];
  onChange: (personnes: Personne[]) => void;
}) => {
  return (
    <InlineEditWrapper
      disabled={isReadOnly}
      renderOnEdit={({ openState }) => {
        return (
          <PersonnesDropdown
            buttonClassName="border-none"
            values={personnes
              ?.map((p) => p.userId || p.tagId?.toString() || '')
              .filter(Boolean)}
            onChange={({ personnes }) => onChange(personnes)}
            openState={openState}
            displayOptionsWithoutFloater
          />
        );
      }}
    >
      <PlanMetadataItem
        interactive={!isReadOnly}
        icon={icon}
        label={personnes.length > 1 ? label.many : label.one}
        value={
          personnes.length
            ? personnes
                .map((p) => p.userName || p.tagName || '')
                .filter(Boolean)
                .join(', ')
            : null
        }
      />
    </InlineEditWrapper>
  );
};

const PlanMetadataItemBudget = ({
  hideSeparator,
  icon,
  label,
  budget,
  totalFiches,
}: Pick<PlanMetadataItemProps, 'hideSeparator' | 'icon' | 'label'> & {
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
      <PlanMetadataItem
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
