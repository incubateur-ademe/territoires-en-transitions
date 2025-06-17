export const VisibleWhen = ({ children, condition }: { children: React.ReactNode, condition: boolean }) => {
  return condition ? children : null;
};