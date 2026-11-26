import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

export type Mood = 'happy' | 'okay' | 'worried';

/**
 * Home-E, a dog in a beanie. The face changes with how things are going:
 * happy when caught up, okay when something is coming up, worried when
 * something is overdue.
 */
export function Mascot({ mood = 'happy', size = 120 }: { mood?: Mood; size?: number }) {
  const fur = '#D9A066';
  const muzzle = '#F6DDB8';
  const ear = '#8B5A2B';
  const dark = '#2B1D14';
  const hat = '#E8772E';
  const band = '#C65A1C';

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityLabel="Home-E the dog">
      {/* Ears hang behind the head */}
      <Ellipse cx={46} cy={118} rx={19} ry={38} fill={ear} transform="rotate(18 46 118)" />
      <Ellipse cx={154} cy={118} rx={19} ry={38} fill={ear} transform="rotate(-18 154 118)" />

      {/* Head and muzzle */}
      <Ellipse cx={100} cy={114} rx={62} ry={56} fill={fur} />
      <Ellipse cx={100} cy={142} rx={36} ry={27} fill={muzzle} />

      {/* Cheeks */}
      <Circle cx={63} cy={132} r={8} fill="#F08A7E" opacity={0.45} />
      <Circle cx={137} cy={132} r={8} fill="#F08A7E" opacity={0.45} />

      {/* Eyes and brows */}
      {mood === 'happy' ? (
        <G stroke={dark} strokeWidth={5} strokeLinecap="round" fill="none">
          <Path d="M68 110 Q76 100 84 110" />
          <Path d="M116 110 Q124 100 132 110" />
        </G>
      ) : (
        <G>
          <Circle cx={76} cy={108} r={8} fill={dark} />
          <Circle cx={124} cy={108} r={8} fill={dark} />
          <Circle cx={79} cy={105} r={2.6} fill="#FFFFFF" />
          <Circle cx={127} cy={105} r={2.6} fill="#FFFFFF" />
        </G>
      )}
      {mood === 'worried' ? (
        <G stroke={dark} strokeWidth={4} strokeLinecap="round">
          <Line x1={66} y1={92} x2={84} y2={97} />
          <Line x1={134} y1={92} x2={116} y2={97} />
        </G>
      ) : null}

      {/* Nose and mouth */}
      <Ellipse cx={100} cy={130} rx={12} ry={8.5} fill={dark} />
      <Ellipse cx={96} cy={127} rx={3.5} ry={2} fill="#FFFFFF" opacity={0.5} />
      <Path d="M100 138 V144" stroke={dark} strokeWidth={4} strokeLinecap="round" />
      {mood === 'worried' ? (
        <Path d="M87 154 Q100 146 113 154" stroke={dark} strokeWidth={4} strokeLinecap="round" fill="none" />
      ) : (
        <>
          {mood === 'happy' ? <Path d="M93 149 Q100 166 107 149 Z" fill="#E86A7A" /> : null}
          <Path d={mood === 'happy' ? 'M84 145 Q100 158 116 145' : 'M88 147 Q100 154 112 147'} stroke={dark} strokeWidth={4} strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Beanie */}
      <Path d="M42 82 C42 30 158 30 158 82 Z" fill={hat} />
      <Path d="M72 54 C80 47 90 44 100 44" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.25} fill="none" />
      <Rect x={34} y={70} width={132} height={28} rx={14} fill={band} />
      <G stroke="#8F3D10" strokeWidth={3} strokeLinecap="round" opacity={0.55}>
        {[48, 60, 72, 84, 96, 108, 120, 132, 144, 156].map((x) => (
          <Line key={x} x1={x} y1={76} x2={x} y2={92} />
        ))}
      </G>
      <Circle cx={100} cy={26} r={15} fill="#F4F1E8" />
      <Circle cx={95} cy={21} r={5} fill="#FFFFFF" opacity={0.8} />
    </Svg>
  );
}
