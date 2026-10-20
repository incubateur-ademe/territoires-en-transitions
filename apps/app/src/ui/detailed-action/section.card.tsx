import { type JSX, type ReactNode, useId } from 'react';

const Section = ({
  title,
  children,
}: {
  readonly title?: string;
  readonly children: ReactNode;
}): JSX.Element => {
  const titleId = useId();

  if (title === undefined) {
    return <div className="w-full rounded-[10px] bg-white p-8">{children}</div>;
  }

  return (
    <section
      aria-labelledby={titleId}
      className="w-full rounded-[10px] bg-white p-8"
    >
      <h2
        id={titleId}
        className="mb-6 text-lg font-bold leading-4 text-primary-10"
      >
        {title}
      </h2>
      {children}
    </section>
  );
};

export { Section };
