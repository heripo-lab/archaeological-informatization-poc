export type PDFBBoxCoords = {
  x0: number;
  top: number;
  x1: number;
  bottom: number;
};

export type PDFContent = {
  page: number;
  bbox: PDFBBoxCoords;
};

export type PDFTextContent = {
  text: string;
} & PDFContent;

export type PDFImageContent = {
  src: string;
} & PDFContent;

export type PDFData = {
  texts: PDFTextContent[];
  images: PDFImageContent[];
};

export type PDFCaption = {
  prefix: string;
  num: number;
  text: string;
};

export type DetailCaption = {
  prefix: string;
  num: number;
  text: string;
  str: string | null;
  fullStr: string | null;
};

export interface PDFImageContentWithCaption extends PDFImageContent {
  caption: PDFCaption | null;
}

export type PDFImageContentWithDetailCaption = Omit<PDFImageContentWithCaption, 'page' | 'bbox' | 'caption'> & {
  caption: DetailCaption | null;
};

export type PDFDataWithCaption = {
  texts: PDFTextContent[];
  images: PDFImageContentWithCaption[];
};

export type PDFTextByPage = {
  page: number;
  text: string;
};

export enum PageType {
  ONE = 1,
  TWO = 2,
}

export interface PDFImageContentWithCaption extends PDFImageContent {
  caption: PDFCaption | null;
}
