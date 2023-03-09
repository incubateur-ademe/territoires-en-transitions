import classNames from 'classnames';

const SmallIconButton = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={classNames(
      'ml-1 px-1 w-7 text-sm inline-block text-center',
      className
    )}
    {...props}
  />
);
export const ButtonClose = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <SmallIconButton
    className={classNames('fr-fi-close-line', className)}
    {...props}
  />
);

export const ButtonRemove = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <SmallIconButton
    className={classNames('fr-fi-delete-line', className)}
    {...props}
  />
);

export const ButtonComment = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <SmallIconButton
    className={classNames('fr-icon-quote-line', className)}
    {...props}
  />
);

export const ButtonEdit = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <SmallIconButton
    className={classNames('fr-fi-edit-line', className)}
    {...props}
  />
);
