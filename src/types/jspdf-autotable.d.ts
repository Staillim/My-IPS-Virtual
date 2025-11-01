declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    styles?: any;
    headStyles?: any;
    theme?: string;
    alternateRowStyles?: any;
    columnStyles?: any;
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}
