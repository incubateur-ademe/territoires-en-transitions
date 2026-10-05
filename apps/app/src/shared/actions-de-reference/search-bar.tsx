import { appLabels } from '@/app/labels/catalog';
import { Input } from '@tet/ui';
import { type JSX, useState } from 'react';

type SyncedSearchText = {
  readonly typedText: string;
  readonly typeText: (text: string) => void;
  readonly searchTypedText: (text: string) => void;
};

const useSyncedSearchText = ({
  searchedText,
  onSearch,
}: {
  readonly searchedText: string;
  readonly onSearch: (text: string) => void;
}): SyncedSearchText => {
  const [typedText, setTypedText] = useState(searchedText);
  const [lastReceivedText, setLastReceivedText] = useState(searchedText);
  const [lastTransmittedText, setLastTransmittedText] = useState(searchedText);

  const hasReceivedNewText = searchedText !== lastReceivedText;
  const isTransmittedTextComingBack = searchedText === lastTransmittedText;
  const hasReceivedOutsideText =
    hasReceivedNewText && !isTransmittedTextComingBack;
  if (hasReceivedNewText) {
    setLastReceivedText(searchedText);
  }
  if (hasReceivedOutsideText) {
    setLastTransmittedText(searchedText);
    setTypedText(searchedText);
  }

  const searchTypedText = (text: string): void => {
    const isTextStillTyped = text === typedText;
    if (!isTextStillTyped) {
      return;
    }
    setLastTransmittedText(text);
    onSearch(text);
  };

  return { typedText, typeText: setTypedText, searchTypedText };
};

type SearchBarProps = {
  readonly searchedText: string;
  readonly onSearch: (text: string) => void;
  readonly label?: string;
};

const SearchBar = ({
  searchedText,
  onSearch,
  label = appLabels.actionsDeReferenceRecherche,
}: SearchBarProps): JSX.Element => {
  const { typedText, typeText, searchTypedText } = useSyncedSearchText({
    searchedText,
    onSearch,
  });

  return (
    <Input
      type="search"
      aria-label={label}
      placeholder={label}
      value={typedText}
      onChange={(event) => typeText(event.target.value)}
      onSearch={searchTypedText}
      containerClassname="w-full"
      displaySize="sm"
    />
  );
};

export { SearchBar };
