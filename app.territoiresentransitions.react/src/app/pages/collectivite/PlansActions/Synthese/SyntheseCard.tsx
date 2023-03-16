import DoughnutChart from 'ui/charts/DoughnutChart';

type SyntheseCardProps = {
  title: string;
  data: {
    id: string;
    value: number;
    color?: string;
  }[];
};

const SyntheseCard = ({title, data}: SyntheseCardProps) => {
  return (
    <div
      className="border border-gray-200 flex flex-col h-full pt-6"
      style={{
        height: '350px',
        width: '100%',
        borderBottomWidth: '4px',
      }}
    >
      <div className="mb-auto font-bold line-clamp-3 px-6">{title}</div>
      <DoughnutChart data={data} />
    </div>
  );
};

export default SyntheseCard;
