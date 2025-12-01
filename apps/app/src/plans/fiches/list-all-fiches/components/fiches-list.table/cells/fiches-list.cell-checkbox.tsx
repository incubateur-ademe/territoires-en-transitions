import { Checkbox } from '@tet/ui';

type Props = {
  ficheId: number;
  selectedFicheIds?: number[] | 'all';
  selectAction?: () => void;
};

export const FichesListCellCheckbox = ({
  ficheId,
  selectedFicheIds,
  selectAction,
}: Props) => {
  return (
    <Checkbox
      className="mt-0"
      containerClassname="inline"
      checked={
        selectedFicheIds === 'all' || selectedFicheIds?.includes(ficheId)
      }
      onChange={() => selectAction?.()}
    />
  );
};
