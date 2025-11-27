
import { SkinId, Skin } from './types';

// Physics
export const GRAVITY = 0.25;
export const JUMP_STRENGTH = -4.5;
export const PIPE_SPEED = 2;
export const PIPE_SPAWN_RATE = 100;
export const GAP_SIZE = 110;

// Colors
export const COLOR_SKY = '#70c5ce';
export const COLOR_GROUND = '#ded895';
export const COLOR_GRASS = '#73bf2e';
export const COLOR_PIPE = '#73bf2e';
export const COLOR_PIPE_DARK = '#558c22';

// Palette
const T = null;         // Transparent
const B = '#000000';    // Black Outline
const W = '#ffffff';    // White
const Y = '#f8e71c';    // Yellow/Beak
const O = '#f5a623';    // Orange

// Standard Bird
export const SKIN_DEFAULT_MAP = [
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,B,B,B,B,B,B,T,T,T,T],
  [T,T,T,T,B,B,Y,Y,Y,Y,W,B,T,T,T,T],
  [T,T,T,B,Y,Y,Y,Y,Y,B,W,W,B,T,T,T],
  [T,T,B,Y,Y,Y,Y,Y,Y,B,W,W,B,T,T,T],
  [T,B,Y,Y,Y,Y,Y,Y,Y,B,W,W,B,T,T,T],
  [B,Y,Y,Y,Y,Y,Y,Y,Y,B,B,B,B,B,T,T],
  [B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,T,T,T,T],
  [B,Y,Y,Y,Y,Y,Y,B,B,B,B,B,B,T,T,T],
  [B,Y,Y,Y,Y,W,W,B,O,O,O,O,O,B,T,T],
  [T,B,Y,Y,W,W,W,B,O,O,O,O,O,B,T,T],
  [T,B,B,Y,B,B,B,B,B,O,O,O,B,T,T,T],
  [T,T,B,B,B,T,T,T,B,B,B,B,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
];

export const SKINS: Skin[] = [
  {
    id: SkinId.DEFAULT,
    name: "Classic Bird",
    description: "The original flapper.",
    pixelMap: SKIN_DEFAULT_MAP
  }
];