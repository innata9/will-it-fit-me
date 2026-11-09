import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { Piece } from '../types';

/**
 * Illustrated stand-in for the photo-realistic try-on render.
 * Coloring comes from the selfie analysis; clothes from the chosen pieces.
 * RULE: the figure is always dressed — chosen clothes or a neutral base layer, never nude.
 */

export interface AvatarLook {
  skin?: string;
  hair?: string;
  eyes?: string;
  pieces?: Piece[];
  baseLayer?: boolean;
}

const BASE_TOP = '#D8D5CF';
const BASE_BOTTOM = '#4A4855';

const DRESS = 'M88 72 C80 74 74 76 70 80 C68 86 68 92 70 98 C72 108 74 118 76 128 C77 134 76 140 72 150 C66 164 64 172 64 182 C62 220 58 262 54 300 L146 300 C142 262 138 220 136 182 C136 172 134 164 128 150 C124 140 123 134 124 128 C126 118 128 108 130 98 C132 92 132 86 130 80 C126 76 120 74 112 72 Z';
const TOP = 'M88 72 C80 74 74 76 70 80 C68 86 68 92 70 98 C72 108 74 118 76 128 C77 140 74 156 70 178 L130 178 C126 156 123 140 124 128 C126 118 128 108 130 98 C132 92 132 86 130 80 C126 76 120 74 112 72 C108 77 92 77 88 72 Z';
const TROUSERS = 'M70 172 C64 210 70 270 74 330 C75 350 77 370 79 388 L95 388 C96 360 97 320 98 290 C99 262 99 246 100 236 C101 246 101 262 102 290 C103 320 104 360 105 388 L121 388 C123 370 125 350 126 330 C130 270 136 210 130 172 Z';
const LEGGINGS = 'M70 172 C66 200 72 260 78 300 C78 320 77 336 80 352 C82 366 83 378 83 386 L93 386 C93 360 95 330 96 300 C97 270 99 246 100 234 C101 246 103 270 104 300 C105 330 107 360 107 386 L117 386 C117 378 118 366 120 352 C123 336 122 320 122 300 C128 260 134 200 130 172 Z';
const LEG_L = 'M80 299 C78 318 77 336 80 352 C82 366 83 378 83 386 L93 386 C93 374 94 360 95 344 C96 328 95 314 95 299 Z';
const LEG_R = 'M120 299 C122 318 123 336 120 352 C118 366 117 378 117 386 L107 386 C107 374 106 360 105 344 C104 328 105 314 105 299 Z';
const ARM_L = 'M72 80 C64 84 62 96 62 110 C61 128 60 144 58 158 C56 174 55 190 55 204 L64 205 C65 190 66 176 68 162 C70 148 71 132 72 116 Z';
const ARM_R = 'M128 80 C136 84 138 96 138 110 C139 128 140 144 142 158 C144 174 145 190 145 204 L136 205 C135 190 134 176 132 162 C130 148 129 132 128 116 Z';

function coat(long: boolean) {
  const b = long ? 282 : 196;
  const mid = (118 + b) / 2;
  const inner = (b + 124) / 2;
  return {
    left: `M88 72 C80 74 74 76 70 80 C66 90 66 104 68 118 C66 150 62 ${mid} 57 ${b} L87 ${b + 2} C87 ${inner} 87 140 88 124 C90 104 92 86 93 74 Z`,
    right: `M112 72 C120 74 126 76 130 80 C134 90 134 104 132 118 C134 150 138 ${mid} 143 ${b} L113 ${b + 2} C113 ${inner} 113 140 112 124 C110 104 108 86 107 74 Z`,
  };
}

function shoeKind(name: string): 'boot' | 'sneaker' | 'flat' {
  const n = name.toLowerCase();
  if (/boot/.test(n)) return 'boot';
  if (/sneaker|trainer|kross|кросів/.test(n)) return 'sneaker';
  return 'flat';
}

export function Avatar({ look, width = 200 }: { look: AvatarLook; width?: number }) {
  const gid = 'shade' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const shade = `url(#${gid})`;
  const skin = look.skin ?? '#D9A88A';
  const hair = look.hair ?? '#6B4A32';
  const eyes = look.eyes ?? '#5E6B3A';

  const pieces = look.baseLayer ? [] : look.pieces ?? [];
  const get = (slot: Piece['slot']) => pieces.find((p) => p.slot === slot);
  const dress = get('dress');
  const top = dress ? undefined : get('top');
  const bottom = dress ? undefined : get('bottom');
  const outer = get('outerwear');
  const shoes = get('shoes');
  const bag = get('bag');
  const coatShape = outer ? coat(/coat|trench|parka|maxi|пальто|тренч/i.test(outer.name)) : null;
  const shoe = shoes ? shoeKind(shoes.name) : null;
  const bottomIsSkirt = bottom ? /skirt|спідниц/i.test(bottom.name) : false;

  return (
    <Svg width={width} height={width * 2.1} viewBox="0 0 200 420" accessibilityLabel={look.baseLayer ? 'You, in a neutral base layer' : 'You, wearing the selected look'}>
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#000" stopOpacity={0.16} />
          <Stop offset="0.32" stopColor="#000" stopOpacity={0} />
          <Stop offset="0.7" stopColor="#000" stopOpacity={0} />
          <Stop offset="1" stopColor="#000" stopOpacity={0.2} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={100} cy={397} rx={42} ry={4.5} fill="#000" fillOpacity={0.09} />
      <Path d="M79 36 C77 12 123 12 121 36 C124 52 125 70 120 86 C114 84 108 80 105 74 L95 74 C92 80 86 84 80 86 C75 70 76 52 79 36 Z" fill={hair} />
      <Path d="M95 58 L95 73 Q100 76 105 73 L105 58 Z" fill={skin} />

      {/* Lower body */}
      {dress || bottomIsSkirt ? (
        <G>
          <Path d={LEG_L} fill={skin} />
          <Path d={LEG_R} fill={skin} />
          <Path d={LEG_L} fill={shade} />
          <Path d={LEG_R} fill={shade} />
        </G>
      ) : (
        <G>
          <Path d={bottom ? TROUSERS : LEGGINGS} fill={bottom?.colorHex ?? BASE_BOTTOM} />
          <Path d={bottom ? TROUSERS : LEGGINGS} fill={shade} />
        </G>
      )}

      {/* Feet / shoes */}
      {!shoe && (
        <G>
          <Ellipse cx={86} cy={390} rx={9} ry={4} fill={skin} />
          <Ellipse cx={114} cy={390} rx={9} ry={4} fill={skin} />
        </G>
      )}
      {shoe === 'flat' && (
        <G fill={shoes!.colorHex}>
          <Path d="M83 383 L93 383 L94 394 L74 394 C74 389 79 386 83 383 Z" />
          <Path d="M117 383 L107 383 L106 394 L126 394 C126 389 121 386 117 383 Z" />
        </G>
      )}
      {shoe === 'sneaker' && (
        <G>
          <Path d="M82 380 L94 380 L95 391 L72 391 C72 385 77 382 82 380 Z" fill={shoes!.colorHex} />
          <Path d="M118 380 L106 380 L105 391 L128 391 C128 385 123 382 118 380 Z" fill={shoes!.colorHex} />
          <Rect x={71} y={391} width={25} height={4} rx={2} fill="#FFF" stroke="#CFCDD6" strokeWidth={0.6} />
          <Rect x={104} y={391} width={25} height={4} rx={2} fill="#FFF" stroke="#CFCDD6" strokeWidth={0.6} />
        </G>
      )}
      {shoe === 'boot' && (
        <G>
          <Path d="M78 312 L96 312 C96 340 95 362 94 382 L95 394 L73 394 C73 388 78 385 82 382 C79 362 77 338 78 312 Z" fill={shoes!.colorHex} />
          <Path d="M122 312 L104 312 C104 340 105 362 106 382 L105 394 L127 394 C127 388 122 385 118 382 C121 362 123 338 122 312 Z" fill={shoes!.colorHex} />
        </G>
      )}

      {/* Skirt sits over the legs */}
      {bottomIsSkirt && bottom && (
        <G>
          <Path d="M70 172 C66 200 60 250 56 300 L144 300 C140 250 134 200 130 172 Z" fill={bottom.colorHex} />
          <Path d="M70 172 C66 200 60 250 56 300 L144 300 C140 250 134 200 130 172 Z" fill={shade} />
        </G>
      )}

      {/* Upper body */}
      {dress ? (
        <G>
          <Path d={DRESS} fill={dress.colorHex} />
          <Path d={DRESS} fill={shade} />
          <Path d="M92 72 L100 82 L108 72 Z" fill={skin} />
          <Path d="M75 122 C90 126 110 126 125 122 L125 130 C110 134 90 134 75 130 Z" fill="#000" fillOpacity={0.22} />
          <G stroke="#000" strokeOpacity={0.12} strokeWidth={1} fill="none">
            <Path d="M86 186 C84 220 81 262 78 297" />
            <Path d="M100 192 C100 230 100 266 100 298" />
            <Path d="M114 186 C116 220 119 262 122 297" />
          </G>
        </G>
      ) : (
        <G>
          <Path d={TOP} fill={top?.colorHex ?? BASE_TOP} />
          <Path d={TOP} fill={shade} />
        </G>
      )}

      {coatShape && outer && (
        <G>
          <Path d={coatShape.left} fill={outer.colorHex} />
          <Path d={coatShape.right} fill={outer.colorHex} />
          <Path d={coatShape.left} fill={shade} />
          <Path d={coatShape.right} fill={shade} />
          <Path d="M93 74 L84 100 L89 104 Z" fill="#000" fillOpacity={0.18} />
          <Path d="M107 74 L116 100 L111 104 Z" fill="#000" fillOpacity={0.18} />
        </G>
      )}

      {/* Arms: coat sleeves, or skin with short sleeves of the top */}
      <Path d={ARM_L} fill={outer ? outer.colorHex : skin} />
      <Path d={ARM_R} fill={outer ? outer.colorHex : skin} />
      <Path d={ARM_L} fill="#000" fillOpacity={0.08} />
      {!outer && (
        <G fill={dress?.colorHex ?? top?.colorHex ?? BASE_TOP}>
          <Path d="M72 80 C64 84 62 96 62 110 L72 112 Z" />
          <Path d="M128 80 C136 84 138 96 138 110 L128 112 Z" />
        </G>
      )}
      <Path d="M55 203 C53 211 54 221 58 223 C62 224 65 214 64 204 Z" fill={skin} />
      <Path d="M145 203 C147 211 146 221 142 223 C138 224 135 214 136 204 Z" fill={skin} />

      {bag && (
        <G>
          <Path d="M116 74 L152 180" stroke={bag.colorHex} strokeWidth={2.4} fill="none" />
          <Path d="M138 178 L166 178 C167 190 166 198 164 200 L140 200 C138 198 137 190 138 178 Z" fill={bag.colorHex} />
          <Path d="M138 178 L166 178 L164 188 L140 188 Z" fill="#000" fillOpacity={0.2} />
        </G>
      )}

      {/* Head */}
      <Ellipse cx={86} cy={45} rx={2.6} ry={4.2} fill={skin} />
      <Ellipse cx={114} cy={45} rx={2.6} ry={4.2} fill={skin} />
      <Path d="M86 32 C86 20 114 20 114 32 L114 44 C114 55 107 63 100 63 C93 63 86 55 86 44 Z" fill={skin} />
      <Path d="M86 32 C86 20 114 20 114 32 L114 44 C114 55 107 63 100 63 C93 63 86 55 86 44 Z" fill="#000" fillOpacity={0.04} />
      <Ellipse cx={91} cy={50} rx={3.6} ry={2} fill="#D7846C" fillOpacity={0.3} />
      <Ellipse cx={109} cy={50} rx={3.6} ry={2} fill="#D7846C" fillOpacity={0.3} />
      <Ellipse cx={94} cy={42} rx={3} ry={1.7} fill="#F6F1EC" />
      <Ellipse cx={106} cy={42} rx={3} ry={1.7} fill="#F6F1EC" />
      <Circle cx={94.2} cy={42} r={1.45} fill={eyes} />
      <Circle cx={105.8} cy={42} r={1.45} fill={eyes} />
      <Circle cx={94.2} cy={42} r={0.6} fill="#1E1A16" />
      <Circle cx={105.8} cy={42} r={0.6} fill="#1E1A16" />
      <Path d="M91 41.3 Q94 39.5 97 41.3" stroke="#3B2F25" strokeWidth={0.8} fill="none" />
      <Path d="M103 41.3 Q106 39.5 109 41.3" stroke="#3B2F25" strokeWidth={0.8} fill="none" />
      <Path d="M90.5 37.6 Q94 35.8 97.5 37" stroke={hair} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <Path d="M102.5 37 Q106 35.8 109.5 37.6" stroke={hair} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <Path d="M100 43 L98.6 50 Q100 51.2 101.6 50" stroke="#000" strokeOpacity={0.25} strokeWidth={0.9} strokeLinecap="round" fill="none" />
      <Path d="M95.5 55 Q98 53.4 100 54.4 Q102 53.4 104.5 55 Q100 56.2 95.5 55 Z" fill="#B9675A" />
      <Path d="M95.5 55 Q100 58.6 104.5 55 Q100 56.2 95.5 55 Z" fill="#C67466" />
      <Path d="M86 36 C86 20 100 14 112 22 C116 26 115 32 114 36 C108 28 98 26 88 40 Z" fill={hair} />
    </Svg>
  );
}
