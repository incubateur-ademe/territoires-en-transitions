import type { JSX, ReactNode } from 'react';
import { CoverBanner } from './cover.banner';
import { FieldTitle } from './field.title';
import { Item } from './item.row';
import { Section } from './section.card';

const Root = ({ children }: { readonly children: ReactNode }): JSX.Element => (
  <div className="flex w-full flex-col gap-6 md:flex-row">{children}</div>
);

const Main = ({ children }: { readonly children: ReactNode }): JSX.Element => (
  <div className="w-full md:flex-[2]">
    <CoverBanner />
    <div className="flex flex-col gap-6">{children}</div>
  </div>
);

const Aside = ({ children }: { readonly children: ReactNode }): JSX.Element => (
  <div className="flex w-full flex-col gap-4 md:flex-[1]">{children}</div>
);

export const DetailedAction = {
  Root,
  Main,
  Aside,
  Section,
  Item,
  FieldTitle,
};
