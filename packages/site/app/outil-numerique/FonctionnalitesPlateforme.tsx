import Markdown from '@components/markdown/Markdown';
import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/strapi/StrapiItem';
import './styles.css';

type FonctionnalitesPlateformeProps = {
  titre: string;
  contenu: string;
  image: StrapiItem;
};

const FonctionnalitesPlateforme = ({
  titre,
  contenu,
  image,
}: FonctionnalitesPlateformeProps) => {
  return (
    <Section>
      <h2 className="text-center">{titre}</h2>
      <div className="flex max-md:flex-col justify-between items-center gap-8 md:gap-20">
        <StrapiImage data={image} containerClassName="max-w-[595px]" />
        <Markdown
          texte={contenu}
          className="fonctionnalites text-primary-10 text-[16px] !leading-[20px] md:text-[21px] md:!leading-[32px] font-[500] max-md:pl-8"
        />
      </div>
    </Section>
  );
};

export default FonctionnalitesPlateforme;
