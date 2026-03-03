import { BlockNoteEditor } from '@blocknote/core';
import {
  BasicTextStyleButton,
  BlockTypeSelect,
  ColorStyleButton,
  CreateLinkButton,
  FormattingToolbar as FormattingToolbarBase,
  FormattingToolbarController,
  blockTypeSelectItems,
} from '@blocknote/react';

export const ENABLED_ITEMS = [
  'paragraph',
  'bulletListItem',
  'numberedListItem',
];

export function FormattingToolbar({ editor }: { editor: BlockNoteEditor }) {
  const items = blockTypeSelectItems(editor.dictionary).filter((item) =>
    ENABLED_ITEMS.includes(item.type)
  );

  return (
    <FormattingToolbarController
      formattingToolbar={() => (
        <div
          onMouseDown={(e) =>
            /**
             * The formatting toolbar is rendered outside the editor (e.g. in a floating layer).
             * Clicking a toolbar button triggers a mousedown on that button, so the browser moves focus
             * from the contentEditable to the button and clears the selection before the button’s click handler runs.
             */
            e.preventDefault()
          }
        >
          <FormattingToolbarBase>
            <BlockTypeSelect key="blockTypeSelect" items={items} />

            <BasicTextStyleButton
              basicTextStyle={'bold'}
              key="boldStyleButton"
            />
            <BasicTextStyleButton
              basicTextStyle={'italic'}
              key="italicStyleButton"
            />
            <BasicTextStyleButton
              basicTextStyle={'underline'}
              key="underlineStyleButton"
            />
            <ColorStyleButton key="colorStyleButton" />
            <CreateLinkButton key="createLinkButton" />
          </FormattingToolbarBase>
        </div>
      )}
    />
  );
}
