import Card from 'ui/exportPdf/components/Card';
import Stack from 'ui/exportPdf/components/Stack';
import { twToCss } from 'ui/exportPdf/utils';
import { FicheActionPdfProps } from './FicheActionPdf';

const Notes = ({ fiche }: FicheActionPdfProps) => {
  const { notesComplementaires } = fiche;

  if (!notesComplementaires) return null;

  return (
    <Card>
      <Stack>
        <h5 style={twToCss('my-0 text-primary-8 text-base')}>
          Notes complémentaires
        </h5>
        <div style={twToCss('text-xs text-primary-10 leading-6')}>
          {notesComplementaires}
        </div>
      </Stack>
    </Card>
  );
};

export default Notes;
