declare module 'pdf-parse-debugging-disabled' {
  function pdfParse(dataBuffer: Buffer): Promise<{ text: string }>;
  export = pdfParse;
}
