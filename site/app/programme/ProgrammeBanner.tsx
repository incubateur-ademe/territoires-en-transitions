/* eslint-disable react/no-unescaped-entities */
import Section from '@components/sections/Section';

type ProgrammeBannerProps = {
  titre: string;
  description?: string;
  couvertureURL?: string;
};

const ProgrammeBanner = ({
  titre,
  description,
  couvertureURL,
}: ProgrammeBannerProps) => {
  const embedLink = couvertureURL?.includes('embed')
    ? couvertureURL
    : couvertureURL?.split('youtu.be').join('www.youtube.com/embed');

  return (
    <Section className="flex-col">
      <h2>{titre}</h2>
      {description && <p className="text-[1.375rem]">{description}</p>}
      {embedLink && (
        <iframe
          className="aspect-video w-full lg:w-4/5 mx-auto"
          src={embedLink}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="Découvrez le programme Territoire Engagé Transition Écologique"
        />
      )}
    </Section>
  );
};

export default ProgrammeBanner;
