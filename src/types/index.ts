// Core game types
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Color {
  hex: string;
  name: string;
  rgb: { r: number; g: number; b: number };
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Cell {
  position: Position;
  color: string;
  type: TileType;
  metadata?: TileMetadata;
}

export enum TileType {
  NORMAL = 'normal',
  LOCKED = 'locked',
  PENALTY = 'penalty',
  ROTATION_LEFT = 'rotation_left',
  ROTATION_RIGHT = 'rotation_right',
  MIRROR_VERTICAL = 'mirror_vertical',
  MIRROR_HORIZONTAL = 'mirror_horizontal',
  INVERSION = 'inversion',
  CHAOS = 'chaos',
  // New tile types for CBLIX2
  WANDERING = 'wandering',
  ONE_WAY = 'one_way',
  TELEPORTER = 'teleporter',
  COLOR_LOCK = 'color_lock',
  TIME_BOMB = 'time_bomb',
  RAINBOW = 'rainbow',
  MAGNETIC = 'magnetic',
}

export interface TileMetadata {
  // For wandering tiles
  nextPosition?: Position;
  wanderPattern?: 'random' | 'circular' | 'diagonal';
  
  // For one-way tiles
  allowedDirections?: Direction[];
  
  // For teleporter tiles
  pairedTeleporterId?: string;
  teleporterId?: string;
  
  // For color-lock tiles
  lockedColors?: string[];
  
  // For time-bomb tiles
  countdown?: number;
  explosionRadius?: number;
  
  // For magnetic tiles
  magneticRadius?: number;
  magneticStrength?: number;
}

export interface Board {
  size: number;
  cells: Cell[][];
  startPosition: Position;
  goalPosition: Position;
}

export interface GameState {
  board: Board;
  currentLevel: number;
  moves: number;
  moveLimit: number;
  score: number;
  gameOver: boolean;
  victory: boolean;
  selectedColor: string | null;
  controlledRegion: Position[];
  visitedSpecialCells: Set<string>;
  undoStack: Board[];
  redoStack: Board[];
}

export interface GameConfig {
  baseColors: Color[];
  minGridSize: number;
  maxGridSize: number;
  difficultyScaling: DifficultyScaling;
  animations: AnimationConfig;
  audio: AudioConfig;
  theme: Theme;
}

export interface DifficultyScaling {
  gridSizeFormula: (level: number) => number;
  colorCountFormula: (level: number) => number;
  moveLimitFormula: (level: number, optimalMoves: number) => number;
  specialTileFormula: (level: number) => SpecialTileConfig[];
}

export interface SpecialTileConfig {
  type: TileType;
  probability: number;
  minLevel: number;
  maxCount?: number;
}

export interface AnimationConfig {
  enabled: boolean;
  particlesEnabled: boolean;
  transitionDuration: number;
  easing: string;
}

export interface AudioConfig {
  enabled: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
}

export interface Theme {
  name: string;
  isDark: boolean;
  colors: ThemeColors;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export interface Statistics {
  gamesPlayed: number;
  gamesWon: number;
  totalMoves: number;
  totalScore: number;
  averageMovesPerGame: number;
  bestScore: number;
  currentStreak: number;
  bestStreak: number;
  achievements: Achievement[];
  playTime: number;
}

export interface SaveData {
  version: string;
  gameState: GameState;
  statistics: Statistics;
  settings: GameSettings;
  lastSaved: Date;
}

export interface GameSettings {
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  musicEnabled: boolean;
  particlesEnabled: boolean;
  colorBlindMode: boolean;
  showHints: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  language: string;
}

// Plugin system types
export interface TilePlugin {
  type: TileType;
  name: string;
  description: string;
  
  // Lifecycle hooks
  onInit?: (board: Board) => void;
  onCellEnter?: (cell: Cell, board: Board) => void;
  onColorChange?: (cell: Cell, newColor: string, board: Board) => boolean;
  onTurnEnd?: (board: Board, gameState: GameState) => void;
  
  // Rendering
  render?: (ctx: CanvasRenderingContext2D, cell: Cell, cellSize: number) => void;
  
  // Validation
  canPlaceAt?: (position: Position, board: Board) => boolean;
  blocksFloodFill?: (cell: Cell, fromColor: string, toColor: string) => boolean;
}

// Event system types
export type GameEventType = 
  | 'game:start'
  | 'game:end'
  | 'game:pause'
  | 'game:resume'
  | 'move:made'
  | 'color:selected'
  | 'tile:activated'
  | 'achievement:unlocked'
  | 'level:completed'
  | 'score:updated';

export interface GameEvent {
  type: GameEventType;
  timestamp: Date;
  data: Record<string, unknown>;
}

// Particle effects types
export interface Particle {
  position: Position;
  velocity: { x: number; y: number };
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'circle' | 'square' | 'star';
}

export interface ParticleEmitter {
  position: Position;
  particles: Particle[];
  emissionRate: number;
  maxParticles: number;
  particleLifetime: number;
  spread: number;
  speed: number;
  colors: string[];
}