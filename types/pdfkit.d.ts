// src/@types/pdfkit.d.ts
declare module 'pdfkit' {
    export default class PDFDocument {
      constructor(options?: any);
      addPage(options?: any): PDFDocument;
      text(text: string, options?: any): PDFDocument;
      end(): void;
      fontSize(size: number): PDFDocument;
      on(event: string, callback: (chunk?: any) => void): PDFDocument;
      // 필요한 다른 메서드 및 속성을 추가할 수 있습니다.
    }
  }