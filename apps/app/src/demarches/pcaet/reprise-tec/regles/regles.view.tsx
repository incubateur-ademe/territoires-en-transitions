'use client';

import { appLabels } from '@/app/labels/catalog';
import Markdown from '@/app/ui/Markdown';
import { PageHeader } from '@tet/ui';
import { markdownClassName, sectionsDesRegles } from './regles.sections';

export const ReglesView = () => (
  <div data-test="admin.reprise-tec.regles" className="flex flex-col gap-6">
    <PageHeader>
      <PageHeader.Title>{appLabels.repriseTecLesRegles}</PageHeader.Title>
      <PageHeader.Subtitle>
        <p className="mb-0 text-sm text-grey-8">
          {appLabels.repriseTecReglesSousTitre}
        </p>
      </PageHeader.Subtitle>
    </PageHeader>
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
