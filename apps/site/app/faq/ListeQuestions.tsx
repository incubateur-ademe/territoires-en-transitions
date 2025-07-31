'use client';

import Markdown from '@/site/components/markdown/Markdown';
import { Accordion, Tab, Tabs } from '@/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { FaqData } from './page';

const onglets = [
  { title: 'Le programme Territoire Engagé', param: 'programme' },
  { title: "L'outil numérique", param: 'outil-numerique' },
];

type ListeQuestionsProps = {
  questions: FaqData[];
};

const ListeQuestions = ({ questions }: ListeQuestionsProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const ongletParam = searchParams.get('onglet');
  const currentTab = ongletParam
    ? onglets.findIndex((onglet) => onglet.param === ongletParam)
    : 0;

  const handleChangeTab = (activeTab: number) => {
    router.push(`${pathname}?onglet=${onglets[activeTab].param}`);
  };

  useEffect(() => {
    if (currentTab === -1)
      router.push(`${pathname}?onglet=${onglets[0].param}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tabs
      defaultActiveTab={currentTab}
      onChange={handleChangeTab}
      tabsListClassName="!flex !w-fit !mx-auto"
    >
      {onglets.map((onglet, index) => (
        <Tab key={index} label={onglet.title}>
          <div className="flex flex-col gap-4">
            {questions
              .filter((question) => question.onglet === onglet.title)
              .map((q) => (
                <div key={q.id}>
                  <Accordion
                    id={q.id.toString()}
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
