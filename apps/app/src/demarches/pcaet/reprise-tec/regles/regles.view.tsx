'use client';

import { appLabels } from '@/app/labels/catalog';
import Markdown from '@/app/ui/Markdown';
import { PageHeader } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Correspondance } from './correspondance';
import { markdownClassName, sectionsDesRegles } from './regles.sections';

const PARTIES = ['regles', 'correspondance'] as const;

export const ReglesView = () => {
  const [partie, setPartie] = useQueryState(
    'partie',
    parseAsStringLiteral(PARTIES)
      .withDefault('regles')
      .withOptions({ history: 'replace' })
  );
  return (
    <div data-test="admin.reprise-tec.regles" className="flex flex-col gap-6">
      <PageHeader className="mb-0">
        <PageHeader.Title>{appLabels.repriseTecLesRegles}</PageHeader.Title>
      </PageHeader>
      <nav className="flex gap-2">
        {PARTIES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPartie(p)}
            aria-current={partie === p ? 'page' : undefined}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm',
              partie === p
                ? 'border-primary-7 bg-primary-1 font-medium text-primary-9'
                : 'border-grey-3 bg-white text-primary-9 hover:border-primary-7'
            )}
          >
            {p === 'regles'
              ? appLabels.repriseTecPartieRegles
              : appLabels.repriseTecPartieCorrespondance}
          </button>
        ))}
      </nav>
      {partie === 'regles' ? <Regles /> : <Correspondance />}
    </div>
  );
};

const Regles = () => (
  <div className="flex flex-col gap-6">
    <p className="mb-0 text-sm text-grey-8">
      {appLabels.repriseTecReglesSousTitre}
    </p>
    <nav className="flex flex-wrap gap-2">
      {sectionsDesRegles.map((s) => (
        <button
          key={s.numero}
          type="button"
          onClick={() =>
            document
              .getElementById(`regle-${s.numero}`)
              ?.scrollIntoView({ behavior: 'smooth' })
          }
          className="rounded-md border border-grey-3 bg-white px-2.5 py-1 text-xs text-primary-9 hover:border-primary-7"
        >
          {appLabels.repriseTecTitreRegle(s.numero, s.titre)}
        </button>
      ))}
    </nav>
    {sectionsDesRegles.map((s) => (
      <section key={s.numero} id={`regle-${s.numero}`} className="scroll-mt-24">
        <h2 className="mb-3 text-lg text-primary-9">
          {appLabels.repriseTecTitreRegle(s.numero, s.titre)}
        </h2>
        <Markdown content={s.texte} className={markdownClassName} />
      </section>
    ))}
  </div>
);
