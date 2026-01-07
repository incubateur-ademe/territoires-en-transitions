import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { FicheNote, FicheWithRelations } from '@tet/domain/plans';
import { Button, cn, Icon, Select, Textarea } from '@tet/ui';
import { format } from 'date-fns';
import { htmlToText } from 'html-to-text';
import { KeyboardEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { getYearsOptions } from '../../utils';
import { NoteDeletionModal } from './note-deletion.modal';
import { newNoteFormSchema, NewNoteFormValues } from './notes-table-schema';

type NotesTableProps = {
  notes: FicheNote[];
  fiche: FicheWithRelations;
  isReadonly: boolean;
  onCreateNote: (editedNote: { note: string; dateNote: number }) => void;
  onDeleteNote: (noteToDeleteId: number) => void;
  onSetEditingNoteId: (id: number | null) => void;
};

const HeaderCell = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <th
      className={cn(
        'text-left uppercase text-sm text-grey-9 font-medium py-3 pl-4 white border-b border-gray-4',
        className
      )}
    >
      {children}
    </th>
  );
};

const Cell = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <td
      className={cn(
        'py-3 px-4 text-sm text-grey-8  border-b border-gray-5',
        className
      )}
    >
      {children}
    </td>
  );
};
export const NotesTable = ({
  notes,
  fiche,
  isReadonly,
  onCreateNote,
  onDeleteNote,
  onSetEditingNoteId,
}: NotesTableProps) => {
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.dateNote).getTime() - new Date(a.dateNote).getTime()
  );
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-0 border border-gray-3 bg-grey-1 rounded-lg overflow-hidden">
          <thead>
            <tr className="border-b border-gray-300">
              <HeaderCell className="w-[125px]">Année</HeaderCell>
              <HeaderCell>Description</HeaderCell>
              <HeaderCell className="w-[300px]">Auteur/Date</HeaderCell>
              <HeaderCell className="w-[80px]" />
            </tr>
          </thead>
          <tbody>
            {sortedNotes.map((note, index) => {
              const year = new Date(note.dateNote).getFullYear();
              return (
                <tr
                  key={note.id}
                  className={cn(
                    'border-b border-gray-200 hover:bg-gray-50 group',
                    index % 2 === 0 && 'bg-grey-2'
                  )}
                >
                  <Cell className="font-bold text-primary-9 text-sm">
                    {year}
                  </Cell>
                  <Cell className="text-primary-9">
                    {htmlToText(note.note)}
                  </Cell>
                  <Cell className="text-sm text-primary-10 align-top">
                    <div className="flex flex-col gap-1 items-start">
                      {note.createdBy && (
                        <div className="flex items-center gap-1">
                          <Icon
                            icon="user-line"
                            size="sm"
                            className="text-grey-8"
                          />
                          <span>
                            Créée par{' '}
                            {note.createdBy
                              ? `${note.createdBy.prenom} ${note.createdBy.nom}`
                              : 'inconnu'}{' '}
                            le {format(new Date(note.createdAt), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      )}
                      {note.modifiedAt &&
                        note.modifiedAt !== note.createdAt && (
                          <div className="flex items-center gap-1">
                            <Icon
                              icon="edit-line"
                              size="sm"
                              className="text-grey-8 self-start"
                            />
                            <span>
                              Modifiée
                              {note.modifiedBy
                                ? ` par ${note.modifiedBy.prenom} ${note.modifiedBy.nom}`
                                : ''}{' '}
                              le{' '}
                              {format(new Date(note.modifiedAt), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        )}
                    </div>
                  </Cell>
                  {!isReadonly && (
                    <Cell className="text-right">
                      <div className="invisible group-hover:visible flex gap-2 justify-end">
                        <Button
                          icon="edit-line"
                          title="Modifier la note"
                          variant="grey"
                          size="xs"
                          onClick={() => onSetEditingNoteId(note.id)}
                        />
                        <NoteDeletionModal
                          fiche={fiche}
                          editedNote={note}
                          onDelete={onDeleteNote}
                        />
                      </div>
                    </Cell>
                  )}
                </tr>
              );
            })}
            {!isReadonly && <CreateNewNoteRow onCreateNote={onCreateNote} />}
          </tbody>
        </table>
      </div>
    </>
  );
};

const CreateNewNoteRow = ({
  onCreateNote,
}: {
  onCreateNote: (editedNote: { note: string; dateNote: number }) => void;
}) => {
  const { yearsOptions, currentYear } = getYearsOptions();

  const { control, handleSubmit, reset } = useForm<NewNoteFormValues>({
    resolver: standardSchemaResolver(newNoteFormSchema),
    defaultValues: {
      year: currentYear,
      description: '',
    },
  });

  const onSubmit = (data: NewNoteFormValues) => {
    if (data.year === undefined) return;
    onCreateNote({
      note: data.description,
      dateNote: data.year,
    });
    reset({
      year: undefined,
      description: '',
    });
  };

  const handleTextareaKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>,
    onSubmit: () => void
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <tr className="border-b border-gray-200">
      <td className="py-3 px-4">
        <Controller
          control={control}
          name="year"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <div>
              <Select
                options={yearsOptions}
                onChange={(selectedYear) =>
                  onChange(selectedYear ? (selectedYear as number) : undefined)
                }
                values={value}
                placeholder="Année"
              />
              {error && (
                <span className="text-error-1 text-xs mt-1">
                  {error.message}
                </span>
              )}
            </div>
          )}
        />
      </td>
      <td className="py-3 px-4">
        <Controller
          control={control}
          name="description"
          render={({
            field: { onChange, value, onBlur, ref },
            fieldState: { error },
          }) => (
            <div>
              <Textarea
                ref={ref}
                placeholder="Saisir une description"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                onKeyDown={(e) =>
                  handleTextareaKeyDown(e, () => handleSubmit(onSubmit)())
                }
                rows={2}
              />
              {error && (
                <span className="text-error-1 text-xs mt-1">
                  {error.message}
                </span>
              )}
            </div>
          )}
        />
      </td>
      <td className="py-3 px-4"></td>
      <td className="py-3 px-4"></td>
    </tr>
  );
};
