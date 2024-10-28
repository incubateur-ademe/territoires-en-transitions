import { Card, Paragraph, Stack, Title } from 'ui/exportPdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';

const Description = ({ fiche }: FicheActionPdfProps) => {
  const { thematiques, sousThematiques, description, ressources } = fiche;

  return (
    <Card className="bg-primary-6 border-primary-6">
      {/* Liste des thématiques et sous-thématiques sous forme de badges */}
      {(thematiques?.length || sousThematiques?.length) && (
        <Paragraph className="font-bold text-info-2">
          {[
            ...(thematiques ?? []).map((t) => t.nom),
            ...(sousThematiques ?? []).map((st) => st.sousThematique),
          ].join(', ')}
        </Paragraph>
      )}

      <Stack gap={3}>
        {/* Description */}
        <Stack gap={1}>
          <Title variant="h5" className="text-grey-1">
            Description de l'action :
          </Title>
          <Paragraph className="text-grey-1">
            {description || 'Non renseigné'}
          </Paragraph>
        </Stack>

        {/* Moyens humains et technqiues */}
        <Stack gap={1}>
          <Title variant="h5" className="text-grey-1">
            Moyens humains et techniques :
          </Title>
          <Paragraph className="text-grey-1">
            {ressources || 'Non renseigné'}
          </Paragraph>
        </Stack>
      </Stack>
    </Card>
  );
};

export default Description;
