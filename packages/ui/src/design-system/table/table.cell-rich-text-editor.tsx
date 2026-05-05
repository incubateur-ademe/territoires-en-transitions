import DOMPurify from 'dompurify';
import { useMemo, useState } from 'react';
import { RichTextEditor } from '../RichTextEditor';
import { RichTextEditorProps } from '../RichTextEditor/RichTextEditor';
import { TableCell, TableCellProps } from './table.cell';

interface TableCellRichTextEditorProps
  extends Omit<TableCellProps, 'edit' | 'children'> {
  richTextEditorProps?: RichTextEditorProps;
  initialValue?: string;
  onValueChange?: (value?: string) => void;
}

export const TableCellRichTextEditor = ({
  richTextEditorProps,
  initialValue,
  onValueChange,
  ...props
}: TableCellRichTextEditorProps) => {
  const [value, setValue] = useState(initialValue);
  const sanitizedPreview = useMemo(
    () => (value ? DOMPurify.sanitize(value) : ''),
    [value]
  );

  return (
    <TableCell
      edit={{
        onClose: () => onValueChange?.(value),
        renderOnEdit: ({ openState }) => (
          <RichTextEditor
            contentStyle={{
              size: 'sm',
            }}
            unstyled
            className="!px-4 !py-3"
            initialValue={initialValue}
            onChange={setValue}
            OnKeyDownCapture={(event) => {
              // On ferme l'éditeur lors de l'appui sur Ctrl+Enter.
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                openState.setIsOpen(false);
              }
            }}
            {...richTextEditorProps}
          />
        ),
      }}
      {...props}
    >
      {sanitizedPreview && (
        <div
          className="overflow-hidden [max-height:3.5lh] [&_*]:leading-5 [&_p]:my-0"
          dangerouslySetInnerHTML={{ __html: sanitizedPreview }}
        />
      )}
    </TableCell>
  );
};
