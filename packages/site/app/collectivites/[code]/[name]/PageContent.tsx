'use client';

import { Tab, Tabs } from '@tet/ui';

type PageContentType = {
  indicateurs: JSX.Element | null;
  programme: JSX.Element | null;
};

const PageContent = ({ indicateurs, programme }: PageContentType) => {
  if (!indicateurs && !programme)
    return <div className="col-span-full md:col-span-7 lg:col-span-8" />;

  if (indicateurs && programme) {
    return (
      <Tabs
        className="col-span-full md:col-span-7 lg:col-span-8"
        tabsListClassName="!bg-primary-1"
      >
        <Tab label="Programme T.E.T.E.">{programme}</Tab>
        <Tab label="Indicateurs locaux">{indicateurs}</Tab>
      </Tabs>
    );
  } else if (indicateurs) return indicateurs;
  else if (programme) return programme;
};

export default PageContent;
