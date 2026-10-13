'use client';

import { appLabels } from '@/app/labels/catalog';
import Markdown from '@/app/ui/Markdown';
import { FloatingPanel } from '@tet/ui';
import { getSectionDeRegle, markdownClassName } from './regles.sections';
import { useRegleOuverte } from './use-regle-ouverte';

export const ReglePanel = () => {
  const [regle, setRegle] = useRegleOuverte();
  const section = regle === null ? undefined : getSectionDeRegle(regle);
  if (!section) {
    return null;
  }
  return (
    <div
      className="fixed right-6 top-24 z-modal max-h-[75vh] w-[28rem] max-w-[calc(100vw-2rem)] overflow-auto"
      data-test="admin.reprise-tec.regle-panel"
    >
      <FloatingPanel
        title={appLabels.repriseTecTitreRegle(section.numero, section.titre)}
        subtitle={appLabels.repriseTecRegleResume}
        onClose={() => setRegle(null)}
      >
        <Markdown content={section.texte} className={markdownClassName} />
      </FloatingPanel>
    </div>
  );
};
