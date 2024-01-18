import Section from '@components/sections/Section';
import {ListeCartesData} from './types';
import Markdown from '@components/markdown/Markdown';

const ListeCartesService = ({titre, introduction, liste}: ListeCartesData) => {
  console.log(titre, introduction, liste);

  return (
    <Section containerClassName="bg-primary-1">
      <h2>{titre}</h2>
      {!!introduction && (
        <Markdown texte={introduction} className="paragraphe-18" />
      )}

      {liste.length > 0 && (
        <div className="grid max-md:grid-cols-1 grid-cols-2 gap-8 mt-6">
          {liste.map(l => (
            <div key={l.id} className="rounded-2xl p-12 bg-white">
              {!!l.preTitre && (
                <div>
                  <div className="text-primary-10 font-bold text-base">
                    {l.preTitre}
                  </div>
                  <div className="text-orange-1 uppercase text-5xl font-extrabold">
                    {l.titre}
                  </div>
                  <Markdown texte={l.texte} className="paragraphe-16 -mb-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
};

export default ListeCartesService;
