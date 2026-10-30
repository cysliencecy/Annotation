export interface RecognizedObject {
  name_en: string;
  name_zh: string;
  description?: string;
  bbox: number[];
}

export interface DemoSample {
  id: string;
  photoSrc: string;
  objects: readonly RecognizedObject[];
}

export type SampleId = 'daily1' | 'flower1';
export type SampleSource = (sampleId: SampleId) => Promise<DemoSample>;

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
  expanded: boolean;
}

export interface ResultData {
  photoSrc: string;
  labels: Label[];
  selected: Label | null;
  sampleId: SampleId;
}

export type ResultMethods = {
  onLabelTap(event: WechatMiniprogram.BaseEvent): void;
  onDotTap(event: WechatMiniprogram.BaseEvent): void;
  onCollapseLabel(): void;
  onCloseCard(): void;
  onSwitchSample(): void;
  loadSample(sampleId: SampleId): void;
};
