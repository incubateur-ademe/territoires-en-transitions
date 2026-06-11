import { Button, Tooltip } from '@tet/ui';
import { JSX, useId } from 'react';

export const FieldWithCopy = ({
  label,
  value,
  copyButtonLabel,
  onCopy,
  multiline,
}: {
  label: string;
  value: string;
  copyButtonLabel: string;
  onCopy: (text: string) => Promise<void>;
  multiline?: boolean;
}): JSX.Element => {
  const id = useId();
  return (
    <div className="flex flex-col items-start gap-2">
      <div>
        <label
          htmlFor={id}
          className="ml-0 block text-sm font-medium text-primary-9"
        >
          {label}
        </label>
      </div>
      <div className="flex w-full gap-2">
        <textarea
          id={id}
          readOnly
          value={value}
          rows={multiline ? 8 : 1}
          className="w-full border border-grey-4 rounded-md p-2 text-sm bg-grey-1 resize-none"
        />
        <div>
          <Tooltip label={copyButtonLabel}>
            <Button
              variant="outlined"
              size="xs"
              onClick={() => onCopy(value)}
              aria-label={copyButtonLabel}
              icon="file-copy-line"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
