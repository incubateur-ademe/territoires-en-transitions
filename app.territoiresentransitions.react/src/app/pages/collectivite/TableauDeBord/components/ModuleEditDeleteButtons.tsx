import { Button } from '@/ui';
type Props = {
  onDeleteClicked?: () => void;
  onEditClicked?: () => void;
};

export const ModuleEditDeleteButtons = ({
  onDeleteClicked,
  onEditClicked,
}: Props) => {
  return (
    <div className="w-full flex justify-center gap-2">
      {onDeleteClicked && (
        <Button size="sm" variant="outlined" onClick={onDeleteClicked}>
          Supprimer le module
        </Button>
      )}
      {onEditClicked && (
        <Button size="sm" onClick={onEditClicked}>
          Modifier le filtre
        </Button>
      )}
    </div>
  );
};
