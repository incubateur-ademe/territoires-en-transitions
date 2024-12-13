import { PersonnePilotePicto } from '@/app/ui/export-pdf/assets/picto';
import { Card, Paragraph, Stack, Title } from '@/app/ui/export-pdf/components';
import { FicheActionPdfProps } from './FicheActionPdf';

const Pilotes = ({ fiche }: FicheActionPdfProps) => {
  const { pilotes } = fiche;

  return (
    <Card className="justify-center">
      <PersonnePilotePicto className="h-14 w-14 mx-auto" />
      <Stack gap={1} className="text-center items-center">
        <Title variant="h6" className="uppercase text-center">
          Personnes pilotes
        </Title>
        {pilotes && pilotes.length ? (
          pilotes.map((pilote) => (
            <Paragraph key={pilote.tagId} className="text-center">
              {pilote.nom}
            </Paragraph>
          ))
        ) : (
          <Paragraph className="text-grey-7 text-center">
            Non renseigné
          </Paragraph>
        )}
      </Stack>
    </Card>
  );
};

export default Pilotes;
