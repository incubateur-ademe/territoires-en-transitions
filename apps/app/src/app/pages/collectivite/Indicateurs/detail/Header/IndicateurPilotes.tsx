import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { MetadataItem, MetadataItemPersonne } from '@/app/ui/metadata-line';
import { InlineEditWrapper } from '@tet/ui';

type Props = {
  definition: IndicateurDefinition;
  isReadonly: boolean;
};

export const IndicateurPilotes = ({ definition, isReadonly }: Props) => {
  const { mutate: updateIndicateur } = useUpdateIndicateur(definition.id);

  return (
    <MetadataItemPersonne
      dataTest="indicateurs.detail.personnes-pilotes"
      hideSeparator
      icon="user-line"
      isReadOnly={isReadonly}
      label={{
        one: appLabels.pilote(),
        many: appLabels.pilote({ plural: true }),
      }}
      personnes={(definition.pilotes ?? []).map((p) => ({
        tagId: p.tagId,
        userId: p.userId,
        tagName: p.tagId ? p.nom : null,
        userName: p.userId ? p.nom : null,
      }))}
      onChange={(personnes) =>
        updateIndicateur({
          pilotes: personnes.map(({ tagId, userId }) => ({ tagId, userId })),
        })
      }
    />
  );
};

export const IndicateurServicesPilotes = ({
  definition,
  isReadonly,
}: Props) => {
  const { mutate: updateIndicateur } = useUpdateIndicateur(definition.id);

  const services = definition.services ?? [];

  return (
    <InlineEditWrapper
      disabled={isReadonly}
      renderOnEdit={({ openState }) => (
        <ServiceTagDropdown
          dataTest="indicateurs.detail.services-pilotes-dropdown"
          buttonClassName="border-none"
          values={services.map((s) => s.id)}
          onChange={({ values }) => updateIndicateur({ services: values })}
          openState={openState}
        />
      )}
    >
      <MetadataItem
        dataTest="indicateurs.detail.services-pilotes"
        hideSeparator
        interactive={!isReadonly}
        icon="briefcase-line"
        label={
          services.length > 1
            ? appLabels.servicePilote({ plural: true })
            : appLabels.servicePilote()
        }
        value={services.map((s) => s.nom).join(', ')}
      />
    </InlineEditWrapper>
  );
};
