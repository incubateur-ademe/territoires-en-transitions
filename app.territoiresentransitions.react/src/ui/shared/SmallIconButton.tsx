const SmallIconButton = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`ml-1 px-1 w-7 text-sm inline-block text-center ${className}`}
    {...props}
  />
);
export const ButtonClose = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <SmallIconButton className={`fr-fi-close-line ${className}`} {...props} />
);

export const ButtonRemove = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <SmallIconButton className={`fr-fi-delete-line ${className}`} {...props} />
);

export const ButtonComment = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <SmallIconButton
    className={`fr-fi-chat-quote-line ${className}`}
    {...props}
  />
);
