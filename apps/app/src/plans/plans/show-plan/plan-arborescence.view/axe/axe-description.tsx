import { RichTextEditor, RichTextView } from '@tet/ui';
import { PlanDisplayOptionsEnum } from '../plan-options.context';
import { AxeSectionTitle } from './axe-section-title';
import { useAxeContext } from './axe.context';

export const AxeDescription = () => {
  const { updateAxe, planOptions, isOpen, isReadOnly, providerProps } =
    useAxeContext();
  const { axe } = providerProps;

  if (
    !isOpen ||
    axe.description === null ||
    !planOptions.isOptionEnabled(PlanDisplayOptionsEnum.DESCRIPTION)
  ) {
    return null;
  }

  return (
    <section>
      <AxeSectionTitle name="description" />
      {isReadOnly ? (
        axe.description ? (
          <RichTextView content={axe.description} />
        ) : null
      ) : (
        <RichTextEditor
          id={`axe-desc-${axe.id}`}
          className="border-0 focus-within:border"
          initialValue={axe.description}
          onChange={(value) => {
            if (value !== axe.description) {
              return updateAxe.mutateAsync({ description: value });
            }
          }}
          debounceDelayOnChange={1000}
        />
      )}
    </section>
  );
};
