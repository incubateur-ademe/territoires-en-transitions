import { twToCss } from '../utils';

type DividerProps = {
  className?: string;
};
const Divider = ({ className }: DividerProps) => {
  return <div style={twToCss(`bg-primary-3 h-px ${className}`)} />;
};

export default Divider;
