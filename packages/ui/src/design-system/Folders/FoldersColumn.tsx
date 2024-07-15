import {Folder} from './Folders';
import FolderButton from './FolderButton';

type FoldersColumnProps = {
  foldersList: Folder[];
  selectedFoldersIds: (number | string)[];
  maxSelectedDepth: number;
  onSelectFolder: (folder: Folder) => void;
};

const FoldersColumn = ({
  foldersList,
  selectedFoldersIds,
  maxSelectedDepth = 0,
  onSelectFolder,
}: FoldersColumnProps) => {
  return (
    <div className="flex flex-col gap-4 px-3">
      {foldersList.map(folder => (
        <FolderButton
          key={folder.id}
          id={folder.id}
          label={folder.name}
          hasChildren={!!folder.children}
          isSelected={
            selectedFoldersIds.includes(folder.id) &&
            folder.depth === maxSelectedDepth
          }
          containsSelectedFolder={
            selectedFoldersIds.includes(folder.id) &&
            folder.depth !== maxSelectedDepth
          }
          onSelect={() => onSelectFolder(folder)}
        />
      ))}
    </div>
  );
};

export default FoldersColumn;
