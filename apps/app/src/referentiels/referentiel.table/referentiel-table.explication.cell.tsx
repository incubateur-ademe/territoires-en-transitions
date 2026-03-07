import { CellContext } from '@tanstack/react-table';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { cn, RichTextEditor, TableCell, Tooltip } from '@tet/ui';
import { htmlToText } from 'html-to-text';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  info: CellContext<ReferentielTableRow, string | undefined>;
};

export const ReferentielTableExplicationCell = ({ info }: Props) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const canHaveExplication =
    info.row.original.type === ActionTypeEnum.ACTION ||
    info.row.original.type === ActionTypeEnum.SOUS_ACTION ||
    info.row.original.type === ActionTypeEnum.TACHE;

  if (!canHaveExplication) {
    return (
      <TableCell
        className={cn(actionTypeToClassName[info.row.original.type])}
      />
    );
  }

  return (
    <TableCell
      className={cn(actionTypeToClassName[info.row.original.type])}
      canEdit={hasCollectivitePermission('referentiels.mutate')}
      edit={{
        renderOnEdit: () => (
          <RichTextEditor
            className="min-h-24 max-w-2xl !rounded-md"
            initialValue={info.getValue()}
            disabled
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
