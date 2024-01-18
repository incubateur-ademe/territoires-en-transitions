import Section from '@components/sections/Section';
import {ListeCartesData} from './types';
import Markdown from '@components/markdown/Markdown';
import MasonryGallery from '@components/galleries/MasonryGallery';
import classNames from 'classnames';
import {StrapiImage} from '@components/strapiImage/StrapiImage';

const ListeCartesService = ({
  titre,
  introduction,
  liste,
  dispositionCartes,
}: ListeCartesData) => {
  return (
    <Section
      containerClassName={classNames({
        'bg-primary-1': dispositionCartes === 'grille',
      })}
    >
      <h2>{titre}</h2>
      {!!introduction && (
        <Markdown texte={introduction} className="paragraphe-18" />
      )}

      {/* Liste de cartes sous forme de grille */}
      {liste.length > 0 && dispositionCartes === 'grille' && (
        <div className="grid max-md:grid-cols-1 grid-cols-2 gap-8 mt-6">
          {liste.map(l => (
            <div key={l.id} className="rounded-2xl p-12 bg-white">
              <div>
                {!!l.preTitre && (
                  <div className="text-primary-10 font-bold text-base">
                    {l.preTitre}
                  </div>
                )}
                <div className="text-orange-1 uppercase text-5xl font-extrabold">
                  {l.titre}
                </div>
                <Markdown texte={l.texte} className="paragraphe-16 -mb-6" />
                {!!l.image && (
                  <StrapiImage
                    data={l.image}
                    className="max-h-[300px] max-w-full"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Liste de cartes sous forme de masonry gallery */}
      {liste.length > 0 && dispositionCartes === 'gallerie' && (
        <MasonryGallery
          maxCols={2}
          data={liste.map(l => (
            <div key={l.id}>
              <div
                key={l.id}
                className="rounded-2xl p-8 border border-primary-4"
              >
                <div>
                  {!!l.preTitre && (
                    <div className="text-xl text-white font-bold bg-primary-6 rounded-full p-1 w-fit min-w-[36px] mb-3">
                      <div className="mx-auto w-fit">{l.preTitre}</div>
                    </div>
                  )}
                  <h4 className="text-primary-8">{l.titre}</h4>
                  <Markdown texte={l.texte} className="paragraphe-16 -mb-6" />
                  {!!l.image && (
                    <StrapiImage
                      data={l.image}
                      className="max-h-[300px] max-w-full"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        />
      )}
    </Section>
  );
};

export default ListeCartesService;
