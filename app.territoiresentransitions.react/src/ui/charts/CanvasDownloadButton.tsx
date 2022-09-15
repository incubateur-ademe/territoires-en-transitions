export type TCanvasDownloadButtonProps = {
  fileName: string;
  canvasId: string;
  buttonText: string;
};

export const CanvasDownloadButton = (props: TCanvasDownloadButtonProps) => {
  const linkId = `download_${props.canvasId}`;
  return (
    <a
      className="fr-btn fr-btn--secondary"
      id={linkId}
      href="/"
      download={`${props.fileName}`}
      onClick={() => {
        const canvas = document.getElementById(
          props.canvasId
        ) as HTMLCanvasElement;
        if (canvas) {
          (document.getElementById(linkId) as HTMLLinkElement).href =
            canvas.toDataURL();
        }
      }}
    >
      <div className="fr-fi-download-line mr-2 text-xs"></div>
      {props.buttonText}
    </a>
  );
};
