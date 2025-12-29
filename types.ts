

export interface ClassificationResult {
  className: string;
  confidence: number;
}

export interface Patch {
  id: string;
  type: 'spectral' | 'geometric' | 'fractal';
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export interface ImageState {
  url: string;
  base64: string;
  width: number;
  height: number;
}

export type GameStatus = 'briefing' | 'patching' | 'scanning' | 'breached' | 'detected';

export interface Mission {
  id: number;
  title: string;
  targetShip: string;
  objective: string;
  successCondition: (results: ClassificationResult[]) => boolean;
  successMessage: string;
}

// Added missing enum required by AttackControls component
export enum AttackType {
  FGSM = 'FGSM',
  PGD = 'PGD',
  PATCH = 'PATCH'
}
