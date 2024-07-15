import {useState} from 'react';
import FoldersColumn from './FoldersColumn';

export type Folder = {
  id: number | string;
  name: string;
  depth: number;
  children?: Folder[];
};

type FoldersProps = {
  foldersList: Folder[];
  onChangeSelection: (selectedFolders: Folder[]) => void;
};

export const Folders = ({foldersList, onChangeSelection}: FoldersProps) => {
  const root = {
    id: 'root',
    name: 'Root',
    depth: -1,
    children: foldersList,
  };

  const [selectedFolders, setSelectedFolders] = useState<Folder[]>([root]);

  const handleSelectFolder = (selectedFolder: Folder) => {
    const currentDepth = selectedFolders.length - 2;

    const isAlreadySelected = selectedFolders.find(
      folder => folder.id === selectedFolder.id
    );

    const newSelectedFolders = [
      ...selectedFolders.filter(folder => folder.depth < selectedFolder.depth),
    ];

    if (
      !isAlreadySelected ||
      (isAlreadySelected && selectedFolder.depth < currentDepth)
    ) {
      newSelectedFolders.push(selectedFolder);
    }

    setSelectedFolders(newSelectedFolders);

    onChangeSelection(newSelectedFolders.slice(1));

    setTimeout(() => {
      if (
        (!!selectedFolder.children &&
          selectedFolder.children[0].depth > currentDepth) ||
        (!selectedFolder.children && selectedFolder.depth > currentDepth)
      ) {
        const idToScrollTo = !!selectedFolder.children
          ? selectedFolder.children[0].id
          : selectedFolder.id;
        const element = document.getElementById(idToScrollTo.toString());

        if (element) {
          element.scrollIntoView({behavior: 'smooth', inline: 'end'});
        }
      }
    }, 0);
  };

  return (
    <div className="border border-grey-3 rounded-lg grid grid-flow-col auto-cols-[16rem] overflow-x-auto divide-x-[0.5px] divide-primary-3 py-3">
      {selectedFolders.map((f, index) => {
        const children = selectedFolders.find(
          folder => folder.depth === f.depth
        )?.children;

        return !!children ? (
          <FoldersColumn
            key={index}
            foldersList={children}
            selectedFoldersIds={selectedFolders.map(folder => folder.id)}
            maxSelectedDepth={selectedFolders.length - 2}
            onSelectFolder={handleSelectFolder}
          />
        ) : null;
      })}
    </div>
  );
};
