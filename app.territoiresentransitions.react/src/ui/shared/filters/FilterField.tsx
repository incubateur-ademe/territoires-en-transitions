type FilterFieldProps = {
  title: string;
  children: React.ReactNode;
};

const FilterField = ({title, children}: FilterFieldProps) => {
  return (
    <div className="w-full">
      <p className="mb-2 font-medium">{title}</p>
      <div className="shadow border-b border-b-gray-500">{children}</div>
    </div>
  );
};

export default FilterField;
