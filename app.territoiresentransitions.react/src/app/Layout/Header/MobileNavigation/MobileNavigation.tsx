type Props = {
  toggleMobileNavigation: () => void;
};

const MobileNavigation = ({toggleMobileNavigation}: Props) => {
  return (
    <div className="fixed inset-0 z-50 bg-white">
      <button
        onClick={toggleMobileNavigation}
        className="m-16 px-6 py-2 text-white bg-blue-500 rounded"
      >
        Fermer
      </button>
    </div>
  );
};

export default MobileNavigation;
