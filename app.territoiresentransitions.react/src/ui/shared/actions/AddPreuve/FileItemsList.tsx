import {FileItem, TFileItem, UploadStatusCode} from './FileItem';

export type TFileItemsListProps = {
  items: Array<TFileItem>;
};

type TGroupedItems = {
  completed: Array<TFileItem>;
  running: Array<TFileItem>;
  failed: Array<TFileItem>;
};
const emptyGroups: TGroupedItems = {
  completed: [],
  running: [],
  failed: [],
};

const groupByStatus = (
  result: TGroupedItems,
  item: TFileItem
): TGroupedItems => {
  const {status} = item;
  switch (status.code) {
    case UploadStatusCode.completed:
      return {...result, completed: [...result.completed, item]};
    case UploadStatusCode.running:
      return {...result, running: [...result.running, item]};
    case UploadStatusCode.failed:
      return {...result, failed: [...result.failed, item]};
    default:
      return result;
  }
};

/**
 * Affiche la liste des fichiers uploadés/en cours d'upload/en erreur
 */
export const FileItemsList = (props: TFileItemsListProps) => {
  const {items} = props;
  const {completed, running, failed} = items.reduce(groupByStatus, emptyGroups);
  console.log({items, completed, running, failed});
  return (
    <div>
      <div className="pb-4">
        {completed.map(item => (
          <FileItem key={item.file.name} {...item} />
        ))}
      </div>
      <div className="pb-4">
        {running.map(item => (
          <FileItem key={item.file.name} {...item} />
        ))}
      </div>
      <div className="pt-1">
        {failed.map(item => (
          <FileItem key={item.file.name} {...item} />
        ))}
      </div>
    </div>
  );
};
