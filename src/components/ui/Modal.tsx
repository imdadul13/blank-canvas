import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Modal — the single overlay primitive for the whole app.
 *
 * Behaviour and accessibility come from Radix Dialog (focus trap, focus
 * restore, scroll lock, Escape, aria-modal, portal, nested-overlay
 * stacking). Everything visual is ours, so the surface reads as the same
 * material as the rest of the product instead of 40 hand-rolled dialects.
 *
 * Four presentations, one anatomy:
 *   center     — the default dialog
 *   sheet      — bottom sheet, for pickers and short forms
 *   drawer     — side panel, for history and lists
 *   fullscreen — immersive takeovers (exam mode, image viewer)
 *
 * ```tsx
 * <Modal open={open} onOpenChange={setOpen} title="Settings" accent="#007AFF">
 *   <ModalBody>…</ModalBody>
 *   <ModalFooter>…</ModalFooter>
 * </Modal>
 * ```
 */

export type ModalVariant = 'center' | 'sheet' | 'drawer' | 'fullscreen';

const PANEL_SPRING: Transition = { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 };
const BACKDROP_SPRING: Transition = { type: 'spring', stiffness: 400, damping: 34 };

/** In: rise + settle. Sheet/drawer/fullscreen slide from their own edge. */
function panelMotion(variant: ModalVariant) {
  switch (variant) {
    case 'sheet':
      return { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
    case 'drawer':
      return { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };
    case 'fullscreen':
      return { initial: { opacity: 0, scale: 1.02 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.02 } };
    default:
      return { initial: { opacity: 0, scale: 0.94, y: 24 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: 12 } };
  }
}

const OVERLAY_LAYOUT: Record<ModalVariant, string> = {
  center: 'items-center justify-center p-3 sm:p-4',
  sheet: 'items-end justify-center',
  drawer: 'items-stretch justify-end',
  fullscreen: 'items-stretch justify-stretch',
};

const PANEL_BASE = 'bg-white material-thick';

const PANEL_LAYOUT: Record<ModalVariant, string> = {
  // max-height subtracts the safe areas so a full dialog never sits under
  // a notch or a home indicator.
  center: cn(
    PANEL_BASE,
    'w-full max-h-[calc(100dvh-1.5rem)] rounded-3xl',
    'sm:max-h-[calc(100dvh-3rem)] sm:max-h-[88dvh]',
  ),
  // Sheets widen as the viewport grows, then stop — a full-width sheet on a
  // 27" display reads as a mistake, not as a sheet.
  sheet: cn(
    PANEL_BASE,
    'w-full max-h-[92dvh] rounded-t-3xl',
    'sm:max-w-2xl',
    'pb-[max(0px,var(--safe-b))]',
  ),
  drawer: cn(
    PANEL_BASE,
    'h-full max-h-[100dvh] w-full max-w-[min(32rem,92vw)] rounded-l-3xl',
    'pt-[var(--safe-t)]',
  ),
  fullscreen: cn(
    PANEL_BASE,
    'h-[100dvh] w-full max-w-none rounded-none',
  ),
};

/**
 * `size` is a width hint, but it only means something for the two variants
 * that present as floating cards. A drawer and a fullscreen takeover own
 * their own width, so honouring the cap there just letterboxes them.
 */
const SIZE_APPLIES: Record<ModalVariant, boolean> = {
  center: true,
  sheet: true,
  drawer: false,
  fullscreen: false,
};

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name. Rendered visually by <ModalHeader>, or hidden if absent. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Hide the default close button when the surface supplies its own. */
  hideClose?: boolean;
  variant?: ModalVariant;
  /**
   * Replaces the default title block while keeping the dialog's accessible
   * name, the sticky header and the close button. For headers that need a
   * glyph tile, a status badge, or a trailing control.
   *
   * Requires `title` so the dialog stays named.
   */
  header?: React.ReactNode;
  /** Identity hue. Tints the header icon and the close button's hover. */
  accent?: string;
  /** Constrain the panel. `lg` is the sensible default; override for data-heavy views. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Set false for surfaces that must not close on scrim tap (destructive confirms). */
  dismissOnScrim?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  full: '',
};

const Modal = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  ModalProps
>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      header,
      hideClose = false,
      variant = 'center',
      accent,
      size = 'lg',
      dismissOnScrim = true,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const motionProps = panelMotion(variant);
    // Fullscreen viewers usually own their chrome inside the dialog body.
    // `hideClose` only removes the close affordance; it should not discard
    // the title/header for normal dialogs.
    const hasHeader = Boolean(header || description || (title && variant !== 'fullscreen'));

    // Radix focuses its own (invisible) Content node on open. Redirect that
    // onto the visible panel so the focus ring lands where people look.
    const panelRef = React.useRef<HTMLDivElement>(null);
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        panelRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = node;
      },
      [ref],
    );

    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-scrim"
                  style={{
                    backgroundColor: 'var(--scrim)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={BACKDROP_SPRING}
                  onClick={dismissOnScrim ? undefined : (e) => e.stopPropagation()}
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content
                forceMount
                aria-modal="true"
                className={cn(
                  'pointer-events-none fixed inset-0 z-dialog flex',
                  OVERLAY_LAYOUT[variant],
                )}
                style={{
                  paddingTop: variant === 'center' || variant === 'fullscreen' ? 'var(--safe-t)' : undefined,
                  paddingLeft: variant === 'center' ? 'var(--safe-l)' : undefined,
                  paddingRight: variant === 'center' ? 'var(--safe-r)' : undefined,
                }}
                onPointerDownOutside={
                  dismissOnScrim ? undefined : (e) => e.preventDefault()
                }
                onOpenAutoFocus={(e) => {
                  e.preventDefault();
                  panelRef.current?.focus({ preventScroll: true });
                }}
                {...props}
              >
                {/*
                  The Radix node is an invisible full-viewport layer: it owns
                  focus, the a11y boundary and scrim-dismissal, and it must
                  not block pointer events. The visible panel is a child, so
                  Motion's transform never fights a centring translate.
                */}
                <motion.div
                    ref={setRefs}
                    tabIndex={-1}
                    className={cn(
                      'pointer-events-auto flex flex-col overflow-hidden outline-none',
                      'focus:outline-none',
                      PANEL_LAYOUT[variant],
                      SIZE_APPLIES[variant] && SIZE_CLASS[size],
                      className,
                    )}
                    style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}
                    initial={motionProps.initial}
                    animate={motionProps.animate}
                    exit={motionProps.exit}
                    transition={PANEL_SPRING}
                  >
                  {/* Sheet affordance — the only variant that reads as "pull me down". */}
                  {variant === 'sheet' && (
                    <div
                      aria-hidden="true"
                      className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-[var(--hairline-strong,rgba(60,60,67,0.2))]"
                    />
                  )}

                  {hasHeader ? (
                    <ModalHeader accent={accent} showClose={!hideClose}>
                      {header ? (
                        <>
                          {/* Custom chrome still has to name the dialog. */}
                          <DialogPrimitive.Title className="sr-only">{title ?? 'Dialog'}</DialogPrimitive.Title>
                          {description ? (
                            <DialogPrimitive.Description className="sr-only">
                              {description}
                            </DialogPrimitive.Description>
                          ) : null}
                          {header}
                        </>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <DialogPrimitive.Title asChild>
                            <h2 className="t-title truncate">{title}</h2>
                          </DialogPrimitive.Title>
                          {description ? (
                            <DialogPrimitive.Description asChild>
                              <p className="t-body mt-1 truncate">{description}</p>
                            </DialogPrimitive.Description>
                          ) : null}
                        </div>
                      )}
                    </ModalHeader>
                  ) : (
                    /* Keep the dialog named even when the surface draws its own chrome. */
                    <DialogPrimitive.Title className="sr-only">{title ?? 'Dialog'}</DialogPrimitive.Title>
                  )}

                  {children}
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    );
  },
);
Modal.displayName = 'Modal';

export interface ModalHeaderProps {
  accent?: string;
  showClose?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/** Sticky top bar. Hairline-separated, never scrolls away. */
const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ accent, showClose = true, className, children }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative z-10 flex shrink-0 items-center gap-3 px-5 py-4 hairline-b',
        accent && 'pt-[max(1rem,var(--safe-t))]',
        className,
      )}
      style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}
    >
      {children}
      {showClose ? <ModalClose /> : null}
    </div>
  ),
);
ModalHeader.displayName = 'ModalHeader';

/**
 * The single close affordance. 44×44 so it clears the tap-target floor,
 * which the 32px and 28px versions scattered across the app did not.
 */
const ModalClose = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Close>,
  { className?: string; label?: string }
>(({ className, label = 'Close' }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    aria-label={label}
    className={cn(
      'group/close -mr-1 grid size-11 shrink-0 place-items-center rounded-full',
      'text-[var(--color-ink-3)] transition-colors',
      'hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
      className,
    )}
  >
    <X className="size-[18px] stroke-[2.2] transition-transform duration-200 group-hover/close:rotate-90" />
  </DialogPrimitive.Close>
));
ModalClose.displayName = 'ModalClose';

/** The only scroll container in the dialog. Momentum + no scrollbar chaining. */
const ModalBody = React.forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn('scroll-quiet min-h-0 flex-1 px-5 py-4', className)}
    >
      {children}
    </div>
  ),
);
ModalBody.displayName = 'ModalBody';

/** Sticky action bar. Lays out [hint] … [actions]. */
const ModalFooter = React.forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative z-10 flex shrink-0 items-center justify-between gap-3',
        'border-t border-[var(--color-hairline)] bg-[var(--color-surface)] px-5 py-3.5',
        className,
      )}
    >
      {children}
    </div>
  ),
);
ModalFooter.displayName = 'ModalFooter';

export { Modal, ModalHeader, ModalBody, ModalFooter, ModalClose };
