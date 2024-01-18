import Section from '@components/sections/Section';
import {ListeData} from './types';
import Markdown from '@components/markdown/Markdown';
import {StrapiImage} from '@components/strapiImage/StrapiImage';

const ListeService = ({titre, sousTitre, introduction, contenu}: ListeData) => {
  return (
    <Section className="!gap-12">
      <div className="flex flex-col gap-4">
        <h1 className="mb-0">{titre}</h1>
        {!!sousTitre && <h3 className="text-primary mb-0">{sousTitre}</h3>}
        {!!introduction && <p className="paragraphe-22 mb-0">{introduction}</p>}
      </div>

      {contenu.map(c => (
        <div
          key={c.id}
          className="flex max-md:flex-col gap-6 bg-primary-1 rounded-2xl p-8"
        >
          <div className="flex-none w-[115px] h-[115px] max-md:mx-auto">
            <StrapiImage
              data={c.image}
              containerClassName="h-full w-full"
              className="rounded-2xl h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-4">
            {!!c.titre && <h4 className="mb-0">{c.titre}</h4>}
            <Markdown texte={c.legende} className="paragraphe-16 -mb-6" />
          </div>
        </div>
      ))}
    </Section>
  );
};

export default ListeService;
