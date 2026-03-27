import { RichTextEditor, TableCell, Tooltip } from '@tet/ui';
import { htmlToText } from 'html-to-text';
import { ActionListItem } from '../actions/use-list-actions';

type Props = {
  row: ActionListItem;
  canEdit: boolean;
};

export const ReferentielTableExplicationCell = ({ row, canEdit }: Props) => {
  const explication = row.score.explication;

  return (
    <TableCell
      canEdit={canEdit}
      edit={{
        renderOnEdit: () => (
          <RichTextEditor
            initialValue={explication}
            // onChange={(value) => {
            //   info.row.original.explication = value;
            // }}
          />
        ),
      }}
    >
      {explication && explication.length > 0 && (
        <Tooltip label={htmlToText(explication)}>
          <span className="line-clamp-1">{htmlToText(explication)}</span>
        </Tooltip>
      )}
    </TableCell>
  );
};
