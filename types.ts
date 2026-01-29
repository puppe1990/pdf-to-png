
export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface PagePreview {
  pageNumber: number;
  dataUrl: string;
}

export interface ConversionResult {
  zipBlob: Blob;
  previews: PagePreview[];
  fileName: string;
}
