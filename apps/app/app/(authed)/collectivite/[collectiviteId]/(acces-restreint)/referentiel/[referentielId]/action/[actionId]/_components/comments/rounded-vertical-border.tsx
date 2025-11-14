type Props = {
  color?: string;
  width?: string;
};
const RoundedVerticalBorder = ({
  color = 'bg-primary',
  width = 'w-[4px]',
}: Props) => {
  return <div className={`flex-none ${width} ${color} rounded-full`}></div>;
};

export default RoundedVerticalBorder;
