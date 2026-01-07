import { EditIcon, UserIcon } from '@/app/ui/export-pdf/assets/icons';
import {
  Box,
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { FicheNote } from '@tet/domain/plans';
import { htmlToText } from '@tet/domain/utils';
import { preset } from '@tet/ui';
import { format } from 'date-fns';

const { colors } = preset.theme.extend;

type NotesCardProps = {
  note: FicheNote;
};

const NotesContent = ({ note }: NotesCardProps) => {
  const {
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    dateNote,
    note: noteContent,
  } = note;

  return (
    <Card gap={1} className="w-full p-3">
      <Title variant="h6">{new Date(dateNote).getFullYear()}</Title>

      <Paragraph>{htmlToText(noteContent)}</Paragraph>

      <Stack gap={1.5} direction="row" className="items-center">
        <Stack gap={1} direction="row" className="items-center">
          <UserIcon fill={colors.grey[8]} />
          <Paragraph className="text-[0.6rem] text-grey-8">
            Créée le {format(new Date(createdAt), 'dd/MM/yyyy')} par{' '}
            {createdBy ? `${createdBy.prenom} ${createdBy.nom}` : ''}
          </Paragraph>
        </Stack>

        {modifiedAt !== createdAt && (
          <>
            <Box className="w-[0.5px] h-4 bg-grey-4" />

            <Stack gap={1} direction="row" className="items-center">
              <EditIcon fill={colors.grey[8]} />
              <Paragraph className="text-[0.6rem] text-grey-8">
                Modifiée le {format(new Date(modifiedAt), 'dd/MM/yyyy')} par{' '}
                {modifiedBy ? `${modifiedBy.prenom} ${modifiedBy.nom}` : ''}
              </Paragraph>
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
};

type NotesProps = {
  notes: FicheNote[] | undefined;
  years: number[] | undefined;
};

export const Notes = ({ notes, years }: NotesProps) => {
  if (!notes || notes.length === 0) return null;

  const filteredNotes =
    years === undefined || !years.length || years.includes(0)
      ? notes
      : notes.filter((note) => years.includes(parseInt(note.dateNote)));

  if (filteredNotes.length === 0) return null;

  return (
    <>
      <Divider className="mt-2" />
      <Stack>
        <Title variant="h5" className="text-primary-8 uppercase">
          Notes
        </Title>

        <Stack gap={2.5} direction="row" className="flex-wrap">
          {filteredNotes.map((note) => (
            <NotesContent key={note.dateNote} note={note} />
          ))}
        </Stack>
      </Stack>
    </>
  );
};
