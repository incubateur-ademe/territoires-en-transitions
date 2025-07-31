import { format } from 'date-fns';
import { notFound } from 'next/navigation';

import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { getLegalData } from './get-data';

type Props = {
  params: Promise<{ id: string }>;
};

/** CGU, mentions légales, licence, etc. */
const PageLegal = async ({ params }: Props) => {
  const { id } = await params;

  const data = await getLegalData(id);

  if (!data) return notFound();

  return (
    <Section>
      <h1>{data.titre}</h1>
      <p className="font-bold">
        Mis à jour le {format(new Date(data.updatedAt), 'dd/MM/yyyy')}
      </p>
      <Markdown texte={data.contenu} />
    </Section>
  );
};

export default PageLegal;
