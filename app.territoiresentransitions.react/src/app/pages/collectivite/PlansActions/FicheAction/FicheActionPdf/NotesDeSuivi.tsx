import { FicheActionNote } from '@tet/api/plan-actions';
import { Card, Paragraph, Stack, Title } from 'ui/export-pdf/components';
import { format } from 'date-fns';

type NotesDeSuiviCardProps = {
  noteSuivi: FicheActionNote;
};

const NotesDeSuiviCard = ({ noteSuivi }: NotesDeSuiviCardProps) => {
  const { createdAt, createdBy, modifiedAt, modifiedBy, dateNote, note } =
    noteSuivi;

  return (
    <Card
      wrap={false}
      gap={3}
      direction="row"
      className="w-full p-3 items-start"
    >
      <Stack gap={1} className="w-full">
        {/* Année */}
        <Title variant="h6">{new Date(dateNote).getFullYear()}</Title>

        {/* Contenu */}
        <Paragraph className="text-[0.65rem] text-grey-8 font-medium">
          {note}
        </Paragraph>

        {/* Créée par... / modifiée par... */}
        <Paragraph className="text-[0.65rem]">
          Créée le {format(new Date(createdAt), 'dd/MM/yyyy')} par {createdBy}
          {modifiedAt !== createdAt && (
            <>
              | Modifiée le {format(new Date(modifiedAt), 'dd/MM/yyyy')} par{' '}
              {modifiedBy}
            </>
          )}
        </Paragraph>
      </Stack>
    </Card>
  );
};

type NotesDeSuiviProps = {
  notesSuivi: FicheActionNote[] | undefined;
};

const NotesDeSuivi = ({ notesSuivi }: NotesDeSuiviProps) => {
  if (!notesSuivi) return null;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Notes de suivi et points de vigilance
      </Title>
      <Stack gap={3} direction="row" className="flex-wrap">
        {notesSuivi.map((note) => (
          <NotesDeSuiviCard key={note.dateNote} noteSuivi={note} />
        ))}
      </Stack>
    </Card>
  );
};

export default NotesDeSuivi;
