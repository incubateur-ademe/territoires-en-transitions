import { PropsWithChildren } from 'react';

const Root = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-8 pb-12">{children}</div>
);

const Header = ({ children }: PropsWithChildren) => <>{children}</>;

const Container = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col md:flex-row gap-6 items-start">{children}</div>
);

const Main = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-6 w-full md:flex-[2]">{children}</div>
);

const SideBar = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-4 w-full md:flex-[1]">{children}</div>
);

export const PcaetDetailLayout = {
  Root,
  Header,
  Container,
  Main,
  SideBar,
};
