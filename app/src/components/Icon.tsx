import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'search' | 'heart' | 'heartFill' | 'hanger' | 'user' | 'back' | 'plus' | 'camera'
  | 'image' | 'check' | 'warn' | 'shield' | 'folder' | 'tape' | 'close';

export function Icon({ name, size = 22, color = '#18171C', strokeWidth = 1.8 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'search' && (<><Circle cx={11} cy={11} r={6.5} {...p} /><Path d="M16 16l4.5 4.5" {...p} /></>)}
      {name === 'heart' && <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" {...p} />}
      {name === 'heartFill' && <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" {...p} fill={color} />}
      {name === 'hanger' && <Path d="M10 6a2 2 0 1 1 2 2c-.6.3-1 .8-1 1.5V10L3 16.5h18L13 10" {...p} />}
      {name === 'user' && (<><Circle cx={12} cy={8} r={3.5} {...p} /><Path d="M5 20c1-3.6 3.8-5.5 7-5.5s6 1.9 7 5.5" {...p} /></>)}
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...p} />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === 'camera' && (<><Path d="M4 8h3l2-3h6l2 3h3v11H4z" {...p} /><Circle cx={12} cy={13} r={3.5} {...p} /></>)}
      {name === 'image' && (<><Rect x={3} y={3} width={18} height={18} rx={3} {...p} /><Path d="M8 3v4M3 8h4M16 21v-4M21 16h-4" {...p} /></>)}
      {name === 'check' && <Path d="M5 12l4.5 4.5L19 7" {...p} />}
      {name === 'warn' && (<><Path d="M12 4l9 16H3z" {...p} /><Path d="M12 10v4M12 17v.5" {...p} /></>)}
      {name === 'shield' && <Path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" {...p} />}
      {name === 'folder' && <Path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...p} />}
      {name === 'tape' && (<><Rect x={3} y={8} width={18} height={8} rx={2} {...p} /><Path d="M7 8v3M11 8v4M15 8v3M19 8v4" {...p} /></>)}
    </Svg>
  );
}
