import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { SPRING_SNAPPY, SPRING_SMOOTH } from '@/utils/motionTokens';

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
  const reducedMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      data-solid={solid || undefined}
      className={cn('ui-icon-tile relative grid shrink-0 place-items-center', className)}
      whileHover={reducedMotion ? undefined : { y: -1, scale: 1.045 }}
      transition={SPRING_SNAPPY}
      style={{
        '--icon-color': color,
        width: size,
        height: size,
        borderRadius: size / 4,
      } as React.CSSProperties}
    >
      <Icon
        className="ui-symbol stroke-[2]"
        style={{
          color: solid ? 'white' : color,
          width: size * 0.4,
          height: size * 0.4,
          strokeWidth,
        }}
      />
      {!solid && (
        <span
          className="pointer-events-none absolute inset-[0.5px] rounded-[inherit] border border-[var(--color-hairline-soft)]"
          style={{ borderRadius: size / 4 }}
        />
      )}
    </motion.span>
  );
}

/** Lift-on-press, the shared response for anything tappable in Mentor. */
export const hoverLift = (reduced: boolean | null) =>
  reduced ? {} : { whileHover: { y: -2 }, whileTap: { scale: 0.98 }, transition: SPRING_SMOOTH };
