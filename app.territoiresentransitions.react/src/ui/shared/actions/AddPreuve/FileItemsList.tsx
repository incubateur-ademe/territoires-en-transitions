import {FileItem, TFileItem} from './FileItem';
import {UploadStatus, UploadStatusCode} from './Uploader.d';

export type TFileItemsListProps = {
  actionId: string;
  items: Array<TFileItem>;
  /** Pour notifier de la sortie de l'état "running" */
  onRunningStopped: (fileName: string, status: UploadStatus) => void;
  /** Pour supprimer un item de la liste "failed" */
  onRemoveFailed?: (fileName: string) => void;
};

/**
 * Affiche la liste des fichiers uploadés/en cours d'upload/en erreur
 */
export const FileItemsList = (props: TFileItemsListProps) => {
  const {actionId, items, onRunningStopped, onRemoveFailed} = props;

  // groupe les items terminés/en cours/en erreur
  const {completed, running, failed} = items.reduce(groupByStatus, emptyGroups);

  // et rend chaque groupe d'items
  return (
    <div data-test="FileItems" className="pt-2">
      {renderItems(completed, {actionId})}
      {renderItems(running, {actionId, onRunningStopped})}
      {renderItems(failed, {actionId, onRemoveFailed})}
    </div>
  );
};

// rendu des items
const renderItems = (items: Array<TFileItem>, props?: {}) =>
  items.length ? (
    <div className="pb-4">
      {items.map(item => (
        <FileItem key={item.file.name} {...item} {...props} />
      ))}
    </div>
  ) : null;

// pour grouper les items terminés/en cours/en erreur
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
    case UploadStatusCode.running:
    case UploadStatusCode.failed:
      return {...result, [status.code]: [...result[status.code], item]};
    default:
      return result;
  }
};
