import {
  Divider,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { FicheWithRelations } from '@tet/domain/plans';
import { htmlToText } from '@tet/domain/utils';

const Notes = ({ fiche }: { fiche: FicheWithRelations }) => {
  const { notesComplementaires } = fiche;

  if (!notesComplementaires) return null;

  return (
    <>
      <Divider className="mt-2" />
      <Stack>
        <Title variant="h5" className="text-primary-8 uppercase">
          Notes complémentaires
        </Title>
        <Paragraph>{htmlToText(notesComplementaires)}</Paragraph>
      </Stack>
    </>
  );
};

export default Notes;
