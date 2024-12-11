import { FicheActionNote } from '@/api/plan-actions';
import { preset } from '@/ui';
import { format } from 'date-fns';
import { EditIcon, UserIcon } from 'ui/export-pdf/assets/icons';
import { Card, Paragraph, Stack, Title } from 'ui/export-pdf/components';

const { colors } = preset.theme.extend;

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
        <Paragraph className="text-[0.65rem]">{note}</Paragraph>

        {/* Créée par... / modifiée par... */}
        <Stack gap={1} direction="row" className="items-center">
          <UserIcon fill={colors.grey[8]} />
          <Paragraph className="text-[0.65rem] text-grey-8">
            Créée le {format(new Date(createdAt), 'dd/MM/yyyy')} par {createdBy}
          </Paragraph>
          {modifiedAt !== createdAt && (
            <>
              <Paragraph className="text-[0.65rem] text-grey-8">| </Paragraph>
              <EditIcon fill={colors.grey[8]} />
              <Paragraph className="text-[0.65rem] text-grey-8">
                Modifiée le {format(new Date(modifiedAt), 'dd/MM/yyyy')} par{' '}
                {modifiedBy}
              </Paragraph>
            </>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};

type NotesDeSuiviProps = {
  notesSuivi: FicheActionNote[] | undefined;
};

const NotesDeSuivi = ({ notesSuivi }: NotesDeSuiviProps) => {
  if (!notesSuivi || notesSuivi.length === 0) return null;

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
