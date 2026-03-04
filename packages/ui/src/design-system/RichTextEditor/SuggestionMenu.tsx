import {
  BlockNoteEditor,
  DefaultSuggestionItem,
  filterSuggestionItems,
} from '@blocknote/core';
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
} from '@blocknote/react';
import { allSuggestionItems, SuggestionItem } from './edition-properties';

const getMenuItems = (
  editor: BlockNoteEditor,
  availableSuggestionItems: readonly SuggestionItem[]
): DefaultReactSuggestionItem[] => {
  const items = getDefaultReactSlashMenuItems(editor);
  return items.filter((item) =>
    (availableSuggestionItems as readonly string[]).includes(
      (item as DefaultSuggestionItem).key
    )
  );
};

export function SuggestionMenu({
  editor,
  availableSuggestionItems,
}: {
  editor: BlockNoteEditor;
  availableSuggestionItems?: SuggestionItem[];
}) {
  return (
    <SuggestionMenuController
      triggerCharacter="/"
      getItems={async (query) =>
        filterSuggestionItems(
          getMenuItems(editor, availableSuggestionItems ?? allSuggestionItems),
          query
        )
      }
    />
  );
}
