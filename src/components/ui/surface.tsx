import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPRING_SMOOTH } from '@/utils/motionTokens';

/**
 * The icon tile. Radius is a quarter of the box — a continuous squircle ladder,
 * not three arbitrary steps — plus a specular rim and a shadow in the tile's
 * own hue, which is what stops a flat icon from looking pasted on.
 */
export function IconTile({
  icon: Icon,
  size = 40,
  color = 'var(--accent)',
  solid = false,
  strokeWidth,
  className,
}: {
  icon: LucideIcon;
  size?: number;
  color?: string;
  solid?: boolean;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative grid shrink-0 place-items-center', className)}
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        background: solid ? color : `color-mix(in srgb, ${color} 10%, white)`,
        boxShadow: solid
          ? `0 2px 10px color-mix(in srgb, ${color} 40%, transparent)`
          : `0 2px 8px color-mix(in srgb, ${color} 21%, transparent)`,
      }}
    >
      <Icon
        className="stroke-[2]"
        style={{
          color: solid ? 'white' : color,
          width: size * 0.4,
          height: size * 0.4,
          strokeWidth,
        }}
      />
      {!solid && (
        <span
          className="pointer-events-none absolute inset-[0.5px] rounded-[inherit] border border-white/80"
          style={{ borderRadius: size / 4 }}
        />
      )}
    </span>
  );
}

/** Lift-on-press, the shared response for anything tappable in Mentor. */
export const hoverLift = (reduced: boolean | null) =>
  reduced ? {} : { whileHover: { y: -2 }, whileTap: { scale: 0.98 }, transition: SPRING_SMOOTH };
