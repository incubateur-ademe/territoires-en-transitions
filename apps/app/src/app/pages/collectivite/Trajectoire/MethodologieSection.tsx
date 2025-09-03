import { Fragment } from 'react';

/** Composant pour afficher une section de méthodologie */
export const MethodologieSection = ({
  title,
  content,
}: {
  title: string;
  content: string[];
}) => (
  <>
    <p className="text-primary-8 font-bold mb-0">{title}</p>
    <p className="mb-0 font-normal">
      {content.map((s) => (
        <Fragment key={s}>
          {s}
          <br />
        </Fragment>
      ))}
    </p>
  </>
);
