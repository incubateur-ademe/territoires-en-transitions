import {
  Badge,
  Card,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { htmlToText } from '@/domain/utils';
import { FicheActionPdfProps } from './FicheActionPdf';

const Description = ({ fiche }: FicheActionPdfProps) => {
  const {
    thematiques,
    sousThematiques,
    description,
    ressources,
    instanceGouvernance,
    libreTags,
  } = fiche;

  return (
    <Card gap={2.5} className="bg-primary-2 border-primary-2">
      {/* Liste des thématiques et sous-thématiques sous forme de badges */}
      {(thematiques?.length ||
        sousThematiques?.length ||
        libreTags?.length) && (
        <Stack direction="row" gap={2} className="flex-wrap gap-y-2">
          {thematiques?.map((thematique) => (
            <Badge
              key={thematique.id}
              title={thematique.nom}
              state="info"
              light
            />
          ))}
          {sousThematiques?.map((ssThematique) => (
            <Badge
              key={ssThematique.id}
              title={ssThematique.nom}
              state="info"
              light
            />
          ))}
          {libreTags?.map((tagPerso) => (
            <Badge
              uppercase={false}
              key={tagPerso.id}
              title={tagPerso.nom}
              state="default"
              light
            />
          ))}
        </Stack>
      )}

      <Stack gap={2.5}>
        {/* Description */}
        <Stack gap={1}>
          <Title variant="h5" className="text-primary-10">
            {"Description de l'action :"}
          </Title>
          <Paragraph className="text-primary-10 text-[0.65rem]">
            {htmlToText(description || 'Non renseigné')}
          </Paragraph>
        </Stack>

        {/* Moyens humains et technqiues */}
        <Stack gap={1}>
          <Title variant="h5" className="text-primary-10">
            Moyens humains et techniques :
          </Title>
          <Paragraph className="text-primary-10 text-[0.65rem]">
            {htmlToText(ressources || 'Non renseigné')}
          </Paragraph>
        </Stack>

        {/* Instances de gouvernance */}
        <Stack gap={1}>
          <Title variant="h5" className="text-primary-10">
            Instances de gouvernance :
          </Title>
          <Paragraph className="text-primary-10 text-[0.65rem]">
            {htmlToText(instanceGouvernance || 'Non renseigné')}
          </Paragraph>
        </Stack>
      </Stack>
    </Card>
  );
};

export default Description;
