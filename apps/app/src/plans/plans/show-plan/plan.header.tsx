'use client';
import { usePlanTypeListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanTypeListe';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { Personne } from '@tet/domain/collectivites';
import { cn, Icon, IconValue, InlineEditWrapper, Select } from '@tet/ui';
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
      <div className="flex items-center justify-between gap-2">
        <EditableTitle
          className="text-2xl leading-10 my-0"
          containerClassName="mb-0"
          isReadonly={isReadOnly}
          title={rootAxe.nom}
          onUpdate={(value) => {
            updatePlan({ id, collectiviteId, nom: value });
          }}
        />
        <PlanMenuButton />
      </div>
      <div className="flex flex-col gap-2 grow">
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

  return (
    <div className="flex items-center gap-4 text-sm leading-6 text-primary-9">
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
          className="hover:bg-grey-3"
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
        onChange={(referents) => updatePlan({ id, collectiviteId, referents })}
      />
    </div>
  );
};

const PlanMetadataItem = ({
  className,
  icon,
  label,
  value,
  ...props
}: {
  className?: string;
  icon: IconValue;
  label: string;
  value: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      'flex items-center gap-2 py-2 pr-6 border-r border-primary-3',
      className
    )}
  >
    <Icon icon={icon} />
    <span className="font-normal">{label} : </span>
    {value ? (
    <span className="font-medium">{value}</span>
    ) : (
      <span className="text-warning-1">À compléter</span>
    )}
  </div>
);

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
        className="hover:bg-grey-3"
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
