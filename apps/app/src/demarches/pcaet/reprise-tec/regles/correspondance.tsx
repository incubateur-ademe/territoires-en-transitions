'use client';

import { appLabels } from '@/app/labels/catalog';
import Markdown from '@/app/ui/Markdown';
import { Input } from '@tet/ui';
import { parseAsString, useQueryState } from 'nuqs';
import { correspondanceDesChamps } from './correspondance.content';
import { filterCorrespondance } from './filter-correspondance';
import { markdownClassName } from './regles.sections';

export const Correspondance = () => {
  const [recherche, setRecherche] = useQueryState(
    'champ',
    parseAsString.withDefault('').withOptions({ history: 'replace' })
  );
  const contenu = filterCorrespondance(correspondanceDesChamps, recherche);
  return (
    <div
      className="flex flex-col gap-4"
      data-test="admin.reprise-tec.correspondance"
    >
      <p className="mb-0 text-sm text-grey-8">
        {appLabels.repriseTecCorrespondanceSousTitre}
      </p>
      <Input
        type="search"
        data-test="admin.reprise-tec.correspondance-recherche"
        containerClassname="w-full max-w-md"
        displaySize="sm"
        placeholder={appLabels.repriseTecRechercherChamp}
        value={recherche}
        onChange={(e) => setRecherche(e.target.value || null)}
        onSearch={(v) => setRecherche(v || null)}
      />
      {contenu ? (
        <Markdown
          content={contenu}
          className={`${markdownClassName} [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:text-primary-9 [&_h3]:mt-4 [&_h4]:mt-3 [&_h4]:text-sm [&_h4]:font-bold [&_small]:text-grey-7`}
        />
      ) : (
        <p className="text-sm text-grey-8">{appLabels.repriseTecAucunChamp}</p>
      )}
    </div>
  );
};
