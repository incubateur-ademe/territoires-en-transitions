import { BoutonsArticleData } from '@/site/app/types';
import { Button } from '@/ui';

type BoutonsArticleProps = {
  boutons: BoutonsArticleData;
};

const BoutonsArticle = ({ boutons }: BoutonsArticleProps) => {
  if (boutons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 mx-auto">
      {boutons.map((bouton, idx) => (
        <Button
          key={`${bouton.id}-${bouton.label}`}
          href={bouton.url}
          className="button"
          variant={idx === 0 ? 'primary' : 'outlined'}
          external={bouton.url?.startsWith('http')}
        >
          {bouton.label}
        </Button>
      ))}
    </div>
  );
};

export default BoutonsArticle;
