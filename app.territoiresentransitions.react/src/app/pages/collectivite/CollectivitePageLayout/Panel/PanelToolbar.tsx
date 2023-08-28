type Props = {
  onClose: () => void;
  /** les boutons doivent être à l'intérieur d'un fragment <></> */
  toolbar?: React.ReactNode;
};

const PanelToolbar = ({onClose, toolbar}: Props) => {
  return (
    <div className="min-h-[3rem] shrink-0 flex justify-between items-center p-4 border-b border-b-gray-200">
      <button
        className="text-gray-400 fr-icon-close-line hover:bg-gray-50"
        onClick={onClose}
      />
      {toolbar}
    </div>
  );
};

export default PanelToolbar;
