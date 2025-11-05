import {
  Badge,
  Card,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { FicheWithRelations } from '@/domain/plans';
import { htmlToText } from '@/domain/utils';

const Section = ({
  title,
  value,
}: {
  title: string;
  value: string | null | undefined;
}) => (
  <Stack gap={1}>
    <Title variant="h5" className="text-primary-10">
      {title}
    </Title>
    <Paragraph className="text-primary-10 text-[0.65rem]">
      {htmlToText(value || 'Non renseigné')}
    </Paragraph>
  </Stack>
);

const Description = ({ fiche }: { fiche: FicheWithRelations }) => {
  const {
    thematiques,
    sousThematiques,
    description,
    instanceGouvernance,
    libreTags,
  } = fiche;

  const badgeItems: Array<{
    id: number;
    nom: string;
    state: 'info' | 'default';
    uppercase: boolean;
  }> = [
    ...(thematiques ?? []).map((t) => ({
      ...t,
      state: 'info' as const,
      uppercase: true,
    })),
    ...(sousThematiques ?? []).map((st) => ({
      ...st,
      state: 'info' as const,
      uppercase: true,
    })),
    ...(libreTags ?? []).map((tag) => ({
      ...tag,
      state: 'default' as const,
      uppercase: false,
    })),
  ];

  return (
    <Card gap={2.5} className="bg-primary-2 border-primary-2">
      {/* Liste des thématiques et sous-thématiques sous forme de badges */}
      {(thematiques?.length ||
        sousThematiques?.length ||
        libreTags?.length) && (
        <Stack direction="row" gap={2} className="flex-wrap gap-y-2">
          {badgeItems.map((b) => (
            <Badge
              key={b.id}
              title={b.nom}
              state={b.state}
              uppercase={b.uppercase}
              light
            />
          ))}
        </Stack>
      )}

      <Stack gap={2.5}>
        <Section title={"Description de l'action :"} value={description} />

        <Section
          title="Instances de gouvernance :"
          value={instanceGouvernance}
        />
      </Stack>
    </Card>
  );
};

export default Description;
