import { CellContext } from '@tanstack/react-table';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { cn, RichTextEditor, TableCell, Tooltip } from '@tet/ui';
import { htmlToText } from 'html-to-text';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  info: CellContext<ReferentielTableRow, string | undefined>;
};

export const ReferentielTableExplicationCell = ({ info }: Props) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  return (
    <TableCell
      className={cn(actionTypeToClassName[info.row.original.type])}
      canEdit={hasCollectivitePermission('referentiels.mutate')}
      edit={{
        renderOnEdit: () => (
          <RichTextEditor
            initialValue={info.getValue()}
            // onChange={(value) => {
            //   info.row.original.explication = value;
            // }}
          />
        ),
      }}
    >
      <Tooltip label={htmlToText(info.getValue() ?? '')}>
        <span className="line-clamp-1">
          {htmlToText(info.getValue() ?? '')}
        </span>
      </Tooltip>
    </TableCell>
  );
};
