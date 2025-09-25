import { FicheActionNote } from '@/api/plan-actions';
import { EditIcon, UserIcon } from '@/app/ui/export-pdf/assets/icons';
import {
  Box,
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { htmlToText } from '@/domain/utils';
import { preset } from '@/ui';
import { format } from 'date-fns';

const { colors } = preset.theme.extend;

type NotesDeSuiviCardProps = {
  noteSuivi: FicheActionNote;
};

const NotesDeSuiviCard = ({ noteSuivi }: NotesDeSuiviCardProps) => {
  const { createdAt, createdBy, modifiedAt, modifiedBy, dateNote, note } =
    noteSuivi;

  return (
    <Card gap={1} className="w-full p-3">
      {/* Année */}
      <Title variant="h6">{new Date(dateNote).getFullYear()}</Title>

      {/* Contenu */}
      <Paragraph>{htmlToText(note)}</Paragraph>

      {/* Créée par... / modifiée par... */}
      <Stack gap={1.5} direction="row" className="items-center">
        <Stack gap={1} direction="row" className="items-center">
          <UserIcon fill={colors.grey[8]} />
          <Paragraph className="text-[0.6rem] text-grey-8">
            Créée le {format(new Date(createdAt), 'dd/MM/yyyy')} par {createdBy}
          </Paragraph>
        </Stack>

        {modifiedAt !== createdAt && (
          <>
            <Box className="w-[0.5px] h-4 bg-grey-4" />

            <Stack gap={1} direction="row" className="items-center">
              <EditIcon fill={colors.grey[8]} />
              <Paragraph className="text-[0.6rem] text-grey-8">
                Modifiée le {format(new Date(modifiedAt), 'dd/MM/yyyy')} par{' '}
                {modifiedBy}
              </Paragraph>
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
};

type NotesDeSuiviProps = {
  notesSuivi: FicheActionNote[] | undefined;
  years: number[] | undefined;
};

const NotesDeSuivi = ({ notesSuivi, years }: NotesDeSuiviProps) => {
  if (!notesSuivi || notesSuivi.length === 0) return null;

  const filteredNotes =
    years === undefined || !years.length || years.includes(0)
      ? notesSuivi
      : notesSuivi.filter((note) => years.includes(parseInt(note.dateNote)));

  if (filteredNotes.length === 0) return null;

  return (
    <>
      <Divider className="mt-2" />
      <Stack>
        <Title variant="h5" className="text-primary-8 uppercase">
          Notes de suivi et points de vigilance
        </Title>

        <Stack gap={2.5} direction="row" className="flex-wrap">
          {filteredNotes.map((note) => (
            <NotesDeSuiviCard key={note.dateNote} noteSuivi={note} />
          ))}
        </Stack>
      </Stack>
    </>
  );
};

export default NotesDeSuivi;
