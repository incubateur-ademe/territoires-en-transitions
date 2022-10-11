import DOMPurify from 'dompurify';
import {addTargetToContentAnchors} from 'utils/content';

export const RenderMarkdownText = ({text}: {text: string}) => (
  <div
    className="htmlContent"
    dangerouslySetInnerHTML={{
      __html: DOMPurify.sanitize(addTargetToContentAnchors(text)),
    }}
  />
);
