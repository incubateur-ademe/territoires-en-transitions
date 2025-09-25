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

const ENABLED_ITEMS = ['paragraph', 'bulletListItem', 'numberedListItem'];

export function FormattingToolbar({ editor }: { editor: BlockNoteEditor }) {
  const items = blockTypeSelectItems(editor.dictionary).filter((item) =>
    ENABLED_ITEMS.includes(item.type)
  );

  return (
    <FormattingToolbarController
      formattingToolbar={() => (
        <FormattingToolbarBase>
          <BlockTypeSelect key="blockTypeSelect" items={items} />

          <BasicTextStyleButton basicTextStyle={'bold'} key="boldStyleButton" />
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
      )}
    />
  );
}
