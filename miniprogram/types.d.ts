export interface RecognizedObject {
  name_en: string;
  name_zh: string;
  description: string;
  bbox: number[];
}

export interface DemoSample {
  id: string;
  photoSrc: string;
  objects: readonly RecognizedObject[];
}

export type SampleSource = () => Promise<DemoSample>;

export interface Label {
  id: string;
  english: string;
  chinese: string;
  description: string;
  color: string;
  x: number;
  y: number;
  nearRightEdge: boolean;
  offsetAbove: boolean;
}

export interface ResultData {
  photoSrc: string;
  labels: Label[];
  selected: Label | null;
}

export type ResultMethods = {
  onLabelTap(event: WechatMiniprogram.BaseEvent): void;
  onCloseCard(): void;
};
