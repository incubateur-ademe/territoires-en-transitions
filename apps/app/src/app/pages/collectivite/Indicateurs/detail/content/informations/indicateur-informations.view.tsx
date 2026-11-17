import Markdown from '@/app/ui/Markdown';

export const IndicateurInformations = ({
  description,
}: {
  description: string;
}) => (
  <Markdown
    content={description}
    className="bg-white p-10 border border-grey-3 rounded-xl paragraphe-16 paragraphe-primary-9"
  />
);
