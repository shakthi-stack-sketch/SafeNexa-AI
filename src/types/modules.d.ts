declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }

  function PDFParse(dataBuffer: Buffer, options?: any): Promise<PDFData>;
  export = PDFParse;
}
