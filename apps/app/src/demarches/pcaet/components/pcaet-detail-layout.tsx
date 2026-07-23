import { PropsWithChildren } from 'react';

const Root = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-4 pb-12">{children}</div>
);

const Header = ({ children }: PropsWithChildren) => <>{children}</>;

const Container = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-6 items-start">{children}</div>
);

const Main = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-6 w-full min-w-0">{children}</div>
);

export const PcaetDetailLayout = {
  Root,
  Header,
  Container,
  Main,
};
