type HistoriqueFiltreFieldProps = {
  title: string;
  children: React.ReactNode;
};

const HistoriqueFiltreField = ({
  title,
  children,
}: HistoriqueFiltreFieldProps) => {
  return (
    <div className="w-full">
      <p className="mb-2 font-medium">{title}</p>
      <div className="shadow border-b border-b-gray-500">{children}</div>
    </div>
  );
};

export default HistoriqueFiltreField;
