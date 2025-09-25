import { BlockNoteEditor, DefaultSuggestionItem, filterSuggestionItems } from '@blocknote/core';
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
} from '@blocknote/react';

const ENABLED_ITEMS = ['numbered_list', 'bullet_list', 'paragraph', 'emoji'];

const getMenuItems = (
  editor: BlockNoteEditor
): DefaultReactSuggestionItem[] => {
  const items = getDefaultReactSlashMenuItems(editor);
  return items.filter((item) => ENABLED_ITEMS.includes((item as DefaultSuggestionItem).key));
};

export function SuggestionMenu({ editor }: { editor: BlockNoteEditor }) {
  return (
    <SuggestionMenuController
      triggerCharacter="/"
      getItems={async (query) =>
        filterSuggestionItems(getMenuItems(editor), query)
      }
    />
  );
}
