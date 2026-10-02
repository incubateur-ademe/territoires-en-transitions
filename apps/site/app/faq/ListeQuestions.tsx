'use client';

import Markdown from '@/site/components/markdown/Markdown';
import { Accordion, Tab, Tabs } from '@tet/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { FAQ_TABS } from './faq.tabs';
import type { FaqData } from './faq.data';

type ListeQuestionsProps = {
  questions: FaqData[];
};

const ListeQuestions = ({ questions }: ListeQuestionsProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Un onglet sans question n'est pas affiché (la démarche PCAET avant son lancement).
  const tabs = FAQ_TABS.filter((tab) =>
    questions.some((question) => question.onglet === tab.title)
  );

  const ongletParam = searchParams.get('onglet');
  const currentTab = ongletParam
    ? tabs.findIndex((onglet) => onglet.param === ongletParam)
    : 0;

  const handleChangeTab = (activeTab: number) => {
    router.push(`${pathname}?onglet=${tabs[activeTab].param}`);
  };

  useEffect(() => {
    if (currentTab === -1) router.push(`${pathname}?onglet=${tabs[0].param}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tabs
      defaultActiveTab={currentTab}
      onChange={handleChangeTab}
      tabsListClassName="!flex !w-fit !mx-auto"
    >
      {tabs.map((onglet, index) => (
        <Tab key={index} label={onglet.title}>
          <div className="flex flex-col gap-4">
            {questions
              .filter((question) => question.onglet === onglet.title)
              .map((q) => (
                <div key={q.id}>
                  <Accordion
                    id={q.id}
                    title={q.titre}
                    content={
                      <Markdown
                        texte={q.contenu}
                        className="px-10 py-6 border border-grey-4 rounded-b-lg bg-white"
                      />
                    }
                  />
                </div>
              ))}
          </div>
        </Tab>
      ))}
    </Tabs>
  );
};

export default ListeQuestions;
