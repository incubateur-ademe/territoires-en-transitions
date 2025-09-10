'use client';

import { BlockNoteEditor } from '@blocknote/core';
import { fr } from '@blocknote/core/locales';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { FormattingToolbar } from './FormattingToolbar';
import { SuggestionMenu } from './SuggestionMenu';

import { TextPlaceholder } from '@/ui/design-system/TextPlaceholder/TextPlaceholder';
import './styles.css';

const editorOptions: BlockNoteEditor['options'] = {
  // localisation des éléments d'UI de l'éditeur
  dictionary: fr,
  // évite l'ajout auto d'un bloc à la fin du champ
  trailingBlock: false,
  // désactive l'ajout de titres lors du copier-coller ou de la saisie des raccourcis MD (###)
  heading: { levels: [] },
  // ajoute des attributs HTML sur les éléments de l'éditeur
  domAttributes: {
    editor: {
      // force l'activation du correcteur orthographique du navigateur ?
      spellcheck: 'true',
      // styles du container
      // (le `!outline-none` est requis pour annuler une règle du dsfr)
      class:
        '!outline-none min-h-20 p-3 border border-solid rounded-lg bg-grey-1 overflow-hidden focus-within:border-primary-5',
    },
  },
};

export default function RichTextEditor({
  initialValue,
  disabled = false,
  isLoading = false,
  debounceDelayOnChange = 1000,
  onChange,
}: {
  disabled?: boolean;
  isLoading?: boolean;
  initialValue?: string;
  debounceDelayOnChange?: number;
  onChange: (html: string) => void;
}) {
  const editor = useCreateBlockNote(editorOptions);
  const [lastChange, setLastChange] = useState<string>();

  // écrase le contenu quand la valeur initiale change
  // et qu'elle ne correspond plus à l'état courant de l'éditeur
  useEffect(() => {
    async function setInitialContent() {
      if (initialValue && initialValue !== lastChange) {
        // le contenu initial peut être en markdown
        let blocks = await editor.tryParseMarkdownToBlocks(initialValue);
        // mais si ce n'est pas le cas (le parsing a donné
        // un bloc de code html ou un paragraphe vide)
        // alors on essaye de faire le parsing html
        if (
          !blocks?.length ||
          blocks[0].type === 'codeBlock' ||
          (Array.isArray(blocks[0].content) && !blocks[0].content.length)
        ) {
          blocks = await editor.tryParseHTMLToBlocks(initialValue);
        }
        editor.replaceBlocks(editor.document, blocks);
      }
    }
    setInitialContent();
  }, [editor, initialValue]);

  const handleChange = useDebouncedCallback(async (editor: BlockNoteEditor) => {
    const html = await editor.blocksToHTMLLossy(editor.document);
    // on ajoute un espace insécable dans les paragraphes vides pour ne pas
    // perdre les sauts de lignes
    const content = html.replaceAll('<p></p>', '<p>&nbsp;</p>');
    onChange(content);
    // sauvegarde l'état courant pour éviter de perdre la position du curseur
    // après une invalidation de la query fournissant les données quand le contenu
    // reste identique
    setLastChange(content);
  }, debounceDelayOnChange);

  if (isLoading) {
    return (
      <TextPlaceholder className={editorOptions.domAttributes?.editor?.class} />
    );
  }

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      formattingToolbar={false}
      slashMenu={false}
      editable={!disabled}
      onChange={handleChange}
    >
      <FormattingToolbar editor={editor} />
      <SuggestionMenu editor={editor} />
    </BlockNoteView>
  );
}
