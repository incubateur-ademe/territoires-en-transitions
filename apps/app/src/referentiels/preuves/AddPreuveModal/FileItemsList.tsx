import { VisibleWhen } from '@tet/ui';
import { groupBy } from 'es-toolkit';
import { JSX } from 'react';
import { FileItem, FileUploadItem } from './FileItem';
import { UploadStatusCode } from './types';

const ItemGroup = ({
  items,
  onDismissItem,
}: {
  items: Array<FileUploadItem>;
  onDismissItem?: (itemId: string) => void;
}): JSX.Element => (
  <div className="flex flex-col gap-3">
    {items.map((item) => (
      <FileItem key={item.id} item={item} onDismissItem={onDismissItem} />
    ))}
  </div>
);

export type FileItemsListProps = {
  items: Array<FileUploadItem>;
  onDismissItem?: (itemId: string) => void;
};

export const FileItemsList = ({
  items,
  onDismissItem,
}: FileItemsListProps): JSX.Element => {
  const grouped = groupBy(items, (item) => item.status.code);
  const completed = grouped[UploadStatusCode.completed] ?? [];
  const duplicated = grouped[UploadStatusCode.duplicated] ?? [];
  const inProgress = [
    ...(grouped[UploadStatusCode.preparing] ?? []),
    ...(grouped[UploadStatusCode.running] ?? []),
  ];
  const failed = grouped[UploadStatusCode.failed] ?? [];

  return (
    <div
      data-test="FileItems"
      className="overflow-y-auto max-h-[220px] flex flex-col gap-3"
    >
      <VisibleWhen condition={completed.length > 0}>
        <ItemGroup items={completed} />
      </VisibleWhen>
      <VisibleWhen condition={duplicated.length > 0}>
        <ItemGroup items={duplicated} onDismissItem={onDismissItem} />
      </VisibleWhen>
      <VisibleWhen condition={inProgress.length > 0}>
        <ItemGroup items={inProgress} />
      </VisibleWhen>
      <VisibleWhen condition={failed.length > 0}>
        <ItemGroup items={failed} onDismissItem={onDismissItem} />
      </VisibleWhen>
    </div>
  );
};
