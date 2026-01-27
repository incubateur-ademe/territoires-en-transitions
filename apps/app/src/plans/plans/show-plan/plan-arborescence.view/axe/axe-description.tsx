import { cn, RichTextEditor } from '@tet/ui';
import { isNil } from 'es-toolkit';
import { PlanDisplayOptionsEnum } from '../plan-options.context';
import { AxeSectionTitle } from './axe-section-title';
import { useAxeContext } from './axe.context';

export const AxeDescription = () => {
  const { updateAxe, planOptions, isOpen, isReadOnly, providerProps } =
    useAxeContext();
  const { axe } = providerProps;

  if (
    !isOpen ||
    isNil(axe.description) ||
    !planOptions.isOptionEnabled(PlanDisplayOptionsEnum.DESCRIPTION)
  ) {
    return null;
  }

  return (
    <section>
      <AxeSectionTitle name="description" />
      <RichTextEditor
        disabled={isReadOnly}
        id={`axe-desc-${axe.id}`}
        className={cn('border-0 min-h-6', {
          'focus-within:border': !isReadOnly,
        })}
        initialValue={axe.description}
        onChange={(value) => {
          if (value !== axe.description) {
            return updateAxe.mutateAsync({ description: value });
          }
        }}
        debounceDelayOnChange={1000}
      />
    </section>
  );
};
