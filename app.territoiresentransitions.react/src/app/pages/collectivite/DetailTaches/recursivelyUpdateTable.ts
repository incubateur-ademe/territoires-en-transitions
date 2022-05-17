// copié et adapté à partir de :
// https://nafeu.medium.com/lazy-loading-expandable-rows-with-react-table-cd2fc86b0630

import {TacheDetail} from './useDetailTache';

export const recursivelyUpdateTable = ({
  rows,
  subRowsToInsert,
  parentId,
}: {
  rows: TacheDetail[];
  subRowsToInsert: TacheDetail[];
  parentId: string;
}) =>
  insertIntoTable({
    existingRows: rows,
    subRowsToInsert: subRowsToInsert,
    path: parentId.split('.'),
    parentId,
  });

const insertIntoTable = ({
  existingRows,
  subRowsToInsert,
  path,
  parentId,
}: {
  existingRows: TacheDetail[];
  subRowsToInsert: TacheDetail[];
  path: string[];
  parentId: string;
}): TacheDetail[] => {
  const isLastPathSegment = path.length === 1;

  if (isLastPathSegment) {
    return existingRows.map(row => {
      if (row.identifiant === parentId) {
        return {
          ...row,
          subRows: [...(row.subRows || []), ...subRowsToInsert],
        };
      }

      return row;
    });
  }

  return existingRows.map(row => {
    const [, ...updatedPath] = path;
    if (!row.subRows) {
      return row;
    }

    return {
      ...row,
      subRows: insertIntoTable({
        existingRows: row.subRows,
        subRowsToInsert,
        path: updatedPath,
        parentId,
      }),
    };
  });
};
