import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { appLabels } from '@/app/labels/catalog';
import PiloteIcon from '@/app/plans/plans/components/pilote-icon.svg';
import { Colon } from '@/app/ui/colon';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { SANS_PILOTE_LABEL } from '@tet/domain/plans';
import { cn, Icon, InlineEditWrapper } from '@tet/ui';
import { ReactNode } from 'react';

type InlineItemProps = {
  dataTest: string;
  noms: string[];
  emptyLabel: string;
  icon: ReactNode;
  isReadonly: boolean;
  renderOnEdit: Parameters<typeof InlineEditWrapper>[0]['renderOnEdit'];
};

const InlineItem = ({
  dataTest,
  noms,
  emptyLabel,
  icon,
  isReadonly,
  renderOnEdit,
}: InlineItemProps) => (
  <InlineEditWrapper disabled={isReadonly} renderOnEdit={renderOnEdit}>
    {(props) => (
      <button
        type="button"
        data-test={dataTest}
        {...props}
        className={cn(
          props.className,
          'flex items-center gap-2 hover:opacity-80 transition-opacity'
        )}
      >
        {icon}
        {noms.length > 0 ? (
          <ListWithTooltip
            className="text-sm text-grey-8 font-normal flex"
            list={noms}
          />
        ) : (
          <span className="text-sm text-grey-8 font-normal">{emptyLabel}</span>
        )}
      </button>
    )}
  </InlineEditWrapper>
);

type Props = {
  definition: IndicateurDefinition;
  isReadonly: boolean;
};

export const IndicateurPilotes = ({ definition, isReadonly }: Props) => {
  const { mutate: updateIndicateur, isPending } = useUpdateIndicateur(
    definition.id
  );

  const pilotes = definition.pilotes ?? [];

  return (
    <div className="flex gap-2 hover:bg-grey-3 rounded px-2 py-1 -my-1 -mx-2">
      {appLabels.pilotes}
      <Colon />
      <InlineItem
        dataTest="indicateurs.detail.personnes-pilotes-button"
        noms={pilotes.flatMap((p) => (p.nom ? [p.nom] : []))}
        emptyLabel={SANS_PILOTE_LABEL}
        icon={<PiloteIcon className="w-4 h-4" />}
        isReadonly={isReadonly}
        renderOnEdit={({ openState }) => (
          <div className="w-72">
            <PersonneTagDropdown
              inlineEdit
              openState={openState}
              dataTest="indicateurs.detail.personnes-pilotes"
              values={pilotes.map((p) => getPersonneStringId(p))}
              disabled={isPending}
              onChange={({ personnes }) =>
                updateIndicateur({ pilotes: personnes })
              }
            />
          </div>
        )}
      />
    </div>
  );
};

export const IndicateurServicesPilotes = ({
  definition,
  isReadonly,
}: Props) => {
  const { mutate: updateIndicateur, isPending } = useUpdateIndicateur(
    definition.id
  );

  const services = definition.services ?? [];

  return (
    <div className="flex gap-2 hover:bg-grey-3 rounded px-2 py-1 -my-1 -mx-2">
      <InlineItem
        dataTest="indicateurs.detail.services-pilotes-button"
        noms={services.map((s) => s.nom)}
        emptyLabel={appLabels.directionOuServicePiloteSans}
        icon={<Icon icon="briefcase-line" size="sm" />}
        isReadonly={isReadonly}
        renderOnEdit={({ openState }) => (
          <div className="w-72">
            <ServiceTagDropdown
              inlineEdit
              openState={openState}
              dataTest="indicateurs.detail.services-pilotes"
              values={services.map((s) => s.id)}
              disabled={isPending}
              onChange={({ values }) => updateIndicateur({ services: values })}
            />
          </div>
        )}
      />
    </div>
  );
};
