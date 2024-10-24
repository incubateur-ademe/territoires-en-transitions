import { twToCss } from '../utils';

type StackProps = {
  children: React.ReactNode[];
  gap?: 0 | 1 | 2 | 3 | 4;
  className?: string;
};

/** Flex column display */
const Stack = ({ children, gap = 4, className }: StackProps) => {
  return (
    <div style={twToCss(`flex flex-col ${className}`)}>
      {children.map((child, index) => (
        <div
          key={index}
          style={index !== children.length - 1 ? twToCss(`mb-${gap}`) : {}}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default Stack;
