import { Button } from '../Button';

type PaginationPageButtonProps = {
  pageNumber?: number;
  isSelected?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const PaginationPageButton = ({
  pageNumber,
  isSelected = false,
  onClick,
}: PaginationPageButtonProps) => {
  return (
    <Button
      aria-current="page"
      variant={isSelected ? 'primary' : 'outlined'}
      disabled={pageNumber === undefined}
      size="xs"
      className="!p-2 !w-9 justify-center"
      title={`Page ${pageNumber}`}
      onClick={onClick}
    >
      {pageNumber ?? '...'}
    </Button>
  );
};

export default PaginationPageButton;
