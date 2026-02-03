import classNames from 'classnames';

import { useEffect, useRef } from 'react';
import { TextareaBase, TextareaBaseProps } from '../Textarea/textarea.base';

type Props = TextareaBaseProps & {
  closeEditing?: () => void;
};

export const TableCellTextarea = ({
  dataTest,
  className,
  closeEditing,
  ...props
}: Props) => {
  // Delay focus by one tick so the Enter key that opens the popover
  // is fully processed before this textarea mounts and receives focus,
  // avoiding an unwanted initial newline.
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const length = textareaRef.current?.value.length ?? 0;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(length, length);
    }, 1);

    return () => clearTimeout(timer);
  }, []);

  return (
    <TextareaBase
      dataTest={dataTest}
      {...props}
      ref={textareaRef}
      onEnterKeyDown={closeEditing}
      className={classNames(
        'px-4 py-3 text-sm placeholder:text-sm resize-none',
        className
      )}
      rows={1}
    />
  );
};
