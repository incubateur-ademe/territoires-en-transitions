import {useState} from 'react';

type CopiedValue = string | null;
type CopyFn = (text: string) => Promise<boolean>; // Return success
type ResetFn = () => void;

/**
 * Fourni une fonction permettant de copier une valeur dans le presse-papier
 * Ref: https://usehooks-ts.com/react-hook/use-copy-to-clipboard
 */
const useCopyToClipboard = (): [CopiedValue, CopyFn, ResetFn] => {
  const [copiedText, setCopiedText] = useState<CopiedValue>(null);

  const reset = () => setCopiedText(null);

  const copy: CopyFn = async text => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    // Try to save to clipboard then save it in the state if worked
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.warn('Copy failed', error);
      reset();
      return false;
    }
  };

  return [copiedText, copy, reset];
};

export default useCopyToClipboard;
