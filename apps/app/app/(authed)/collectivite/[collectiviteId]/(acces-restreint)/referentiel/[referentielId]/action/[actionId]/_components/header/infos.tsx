import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import {
  useDeleteMesurePilotes,
  useUpsertMesurePilotes,
} from '@/app/referentiels/actions/use-mesure-pilotes';
import {
  useDeleteMesureServicesPilotes,
  useUpsertMesureServicesPilotes,
} from '@/app/referentiels/actions/use-mesure-services-pilotes';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { useCollectiviteId } from '@tet/api/collectivites';
import { PersonneTagOrUser, Tag } from '@tet/domain/collectivites';
import { Icon, IconValue, InlineEditWrapper } from '@tet/ui';
import { VerticalDivider } from './vertical-divider';

const EmptyField = ({
  icon,
  label,
  ...props
}: {
  icon: IconValue;
  label: string;
} & React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className="flex items-baseline gap-1 py-1 px-2 -mx-2 -my-1 rounded-md hover:bg-grey-3 text-sm text-primary-9 font-normal"
  >
    <Icon icon={icon} size="sm" />
    <span>
      {label} : <span className="text-warning-1">À compléter</span>
    </span>
  </div>
);

type Props = {
  actionId: string;
  pilotes?: PersonneTagOrUser[];
  services?: Tag[];
  isReadOnly?: boolean;
};

export const Infos = ({ actionId, pilotes, services, isReadOnly }: Props) => {
  const collectiviteId = useCollectiviteId();
  const hasPilotes = pilotes && pilotes.length > 0;
  const hasServices = services && services.length > 0;

  const { mutate: upsertPilotes } = useUpsertMesurePilotes();
  const { mutate: deletePilotes } = useDeleteMesurePilotes();
  const { mutate: upsertServices } = useUpsertMesureServicesPilotes();
  const { mutate: deleteServices } = useDeleteMesureServicesPilotes();
  return (
    <>
      <VerticalDivider />
      <InlineEditWrapper
        disabled={isReadOnly}
        renderOnEdit={({ openState }) => (
          <PersonneTagDropdown
            dataTest="action-header-pilote-dropdown"
            buttonClassName="border-none"
            dropdownZindex={1000}
            values={pilotes?.map(getPersonneStringId) ?? []}
            onChange={({ personnes }) => {
              if (personnes.length === 0) {
                deletePilotes({ collectiviteId, mesureId: actionId });
              } else {
                upsertPilotes({
                  collectiviteId,
                  mesureId: actionId,
                  pilotes: personnes.map((p) => ({
                    userId: p.userId ?? null,
                    tagId: p.tagId ?? null,
                  })),
                });
              }
            }}
            openState={openState}
          />
        )}
      >
        {hasPilotes ? (
          <ListWithTooltip
            title="Pilotes"
            list={pilotes.map((p) => p.nom ?? '')}
            icon="user-line"
            hoveringColor="grey"
            disabled={isReadOnly}
            className="text-sm text-primary-9 font-normal"
          />
        ) : (
          <EmptyField icon="user-line" label="Pilotes" />
        )}
      </InlineEditWrapper>
      <VerticalDivider />
      <InlineEditWrapper
        disabled={isReadOnly}
        renderOnEdit={({ openState }) => (
          <ServiceTagDropdown
            dataTest="action-header-service-dropdown"
            dropdownZindex={1000}
            values={services?.map((s) => s.id) ?? []}
            onChange={({ values: newServices }) => {
              if (newServices.length === 0) {
                deleteServices({ collectiviteId, mesureId: actionId });
              } else {
                upsertServices({
                  collectiviteId,
                  mesureId: actionId,
                  services: newServices.map((s) => ({
                    serviceTagId: s.id,
                    tagId: s.id,
                  })),
                });
              }
            }}
            openState={openState}
          />
        )}
      >
        {hasServices ? (
          <ListWithTooltip
            title="Direction ou service pilote"
            list={services.map((s) => s.nom ?? '')}
            icon="briefcase-line"
            hoveringColor="grey"
            disabled={isReadOnly}
            className="text-sm text-primary-9 font-normal"
          />
        ) : (
          <EmptyField
            icon="briefcase-line"
            label="Direction ou service pilote"
          />
        )}
      </InlineEditWrapper>
    </>
  );
};
