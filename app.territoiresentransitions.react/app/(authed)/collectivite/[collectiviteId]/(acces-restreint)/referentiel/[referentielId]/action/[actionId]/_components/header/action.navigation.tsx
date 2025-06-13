import { Button } from '@/ui';

type Props = {
  prevActionLink: string | undefined;
  nextActionLink: string | undefined;
};

const ActionNavigation = ({ prevActionLink, nextActionLink }: Props) => {
  if (!prevActionLink && !nextActionLink) return null;

  return (
    <div className="flex justify-between py-1 border-b border-b-primary-3">
      {!!prevActionLink && (
        <Button
          className="border-b-transparent hover:text-primary-9"
          variant="underlined"
          icon="arrow-left-line"
          size="sm"
          href={prevActionLink}
        >
          Mesure précédente
        </Button>
      )}

      {!!nextActionLink && (
        <Button
          className="ml-auto border-b-transparent hover:text-primary-9"
          variant="underlined"
          icon="arrow-right-line"
          iconPosition="right"
          size="sm"
          href={nextActionLink}
        >
          Mesure suivante
        </Button>
      )}
    </div>
  );
};

export default ActionNavigation;
