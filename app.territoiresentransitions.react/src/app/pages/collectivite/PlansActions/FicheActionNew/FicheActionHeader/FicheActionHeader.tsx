import FicheActionTitle from './FicheActionTitle';

type FicheActionHeaderProps = {
  titre: string | null;
  isReadonly: boolean;
  updateTitle: (value: string) => void;
};

const FicheActionHeader = (props: FicheActionHeaderProps) => {
  return (
    <div className="w-full">
      <FicheActionTitle {...props} />
    </div>
  );
};

export default FicheActionHeader;
