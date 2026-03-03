import { BlockNoteEditor } from '@blocknote/core';
import {
  BasicTextStyleButton,
  BlockTypeSelect,
  blockTypeSelectItems,
  ColorStyleButton,
  CreateLinkButton,
  FormattingToolbar as FormattingToolbarBase,
  FormattingToolbarController,
} from '@blocknote/react';
import { JSX } from 'react';
import { allFormattingActions, FormattingAction } from './edition-properties';

export const ENABLED_ITEMS = [
  'paragraph',
  'bulletListItem',
  'numberedListItem',
];

export function FormattingToolbar({
  editor,
  availableActions,
}: {
  editor: BlockNoteEditor;
  availableActions?: FormattingAction[];
}) {
  const items = blockTypeSelectItems(editor.dictionary).filter((item) =>
    ENABLED_ITEMS.includes(item.type)
  );

  const ActionComponents: Record<FormattingAction, () => JSX.Element> = {
    blockType: () => <BlockTypeSelect key="blockTypeSelect" items={items} />,
    bold: () => (
      <BasicTextStyleButton basicTextStyle="bold" key="boldStyleButton" />
    ),
    italic: () => (
      <BasicTextStyleButton basicTextStyle="italic" key="italicStyleButton" />
    ),
    underline: () => (
      <BasicTextStyleButton
        basicTextStyle="underline"
        key="underlineStyleButton"
      />
    ),
    color: () => <ColorStyleButton key="colorStyleButton" />,
    link: () => <CreateLinkButton key="createLinkButton" />,
  };

  const ActionComponentsList = (availableActions ?? allFormattingActions).map(
    (action) => ActionComponents[action]()
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
          <FormattingToolbarBase>{ActionComponentsList}</FormattingToolbarBase>
        </div>
      )}
    />
  );
}
