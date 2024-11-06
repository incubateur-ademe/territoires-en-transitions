import { Badge, Card, Paragraph, Stack, Title } from 'ui/export-pdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';

const Description = ({ fiche }: FicheActionPdfProps) => {
  const { thematiques, sousThematiques, description, ressources } = fiche;

  return (
    <Card className="bg-primary-6 border-primary-6">
      {/* Liste des thématiques et sous-thématiques sous forme de badges */}
      {(thematiques?.length || sousThematiques?.length) && (
        <Stack direction="row" gap={2.5} className="flex-wrap">
          {thematiques?.map((thematique) => (
            <Badge key={thematique.id} title={thematique.nom} state="info" />
          ))}
          {sousThematiques?.map((ssThematique) => (
            <Badge
              key={ssThematique.id}
              title={ssThematique.sousThematique}
              state="info"
            />
          ))}
        </Stack>
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
