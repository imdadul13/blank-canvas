import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Eye,
  Layers,
  CheckCircle2,
  Scan,
  Activity,
  MoveHorizontal,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { MedicalImageAsset } from '../types';
import { cn } from '@/lib/utils';

export interface MedicalImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  annotatedImageUrl?: string;
  imageAsset?: MedicalImageAsset;
  title?: string;
  whatToLookFor?: string;
  showAnnotatedOption?: boolean;
}

/**
 * Toolbar primitives.
 *
 * The five diagnostic tools used to carry five different active colours
 * (cyan / amber / indigo / amber / emerald), which read as five competing
 * design languages rather than one control. Shape and colour now carry a
 * single meaning — accent means "on" — and the icon plus label carry what
 * the tool is.
 */
function Tool({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        'hit-expand inline-flex h-9 items-center gap-1.5 rounded-xl border px-3',
        'text-[13px] font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        active
          ? 'border-accent/40 bg-accent-tint text-accent-ink'
          : 'border-[var(--color-hairline)] bg-[var(--color-surface-2)] text-[var(--color-ink-2)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]',
      )}
    >
      {children}
    </button>
  );
}

function ZoomButton({
  onClick,
  title,
  label,
  children,
  className,
}: {
  onClick: () => void;
  title: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      className={cn(
        'hit-expand grid size-8 place-items-center rounded-lg text-[var(--color-ink-2)] transition-colors',
        'hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
    >
      {children}
    </button>
  );
}

export const MedicalImageViewerModal: React.FC<MedicalImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  annotatedImageUrl,
  imageAsset,
  title,
  whatToLookFor,
  showAnnotatedOption = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [isInvertedXray, setIsInvertedXray] = useState<boolean>(false);
  const [showAnnotated, setShowAnnotated] = useState<boolean>(false);
  const [isLoupeActive, setIsLoupeActive] = useState<boolean>(false);
  const [isCaliperActive, setIsCaliperActive] = useState<boolean>(false);
  const [showHotspots, setShowHotspots] = useState<boolean>(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // Caliper state (coordinates relative to container)
  const [caliperStart, setCaliperStart] = useState<{ x: number; y: number }>({ x: 260, y: 320 });
  const [caliperEnd, setCaliperEnd] = useState<{ x: number; y: number }>({ x: 380, y: 320 });
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | 'both' | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isHoveringImage, setIsHoveringImage] = useState<boolean>(false);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number; relX: number; relY: number }>({
    x: 0,
    y: 0,
    relX: 50,
    relY: 50,
  });
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);

  const effectiveAnnotatedUrl =
    annotatedImageUrl ||
    imageAsset?.annotatedImageUrl ||
    (imageUrl.endsWith('.svg') && !imageUrl.includes('-annotated')
      ? imageUrl.replace('.svg', '-annotated.svg')
      : undefined);

  const activeSrc = showAnnotated && effectiveAnnotatedUrl ? effectiveAnnotatedUrl : imageUrl;

  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
      setIsHighContrast(false);
      setIsInvertedXray(false);
      setShowAnnotated(false);
      setIsLoupeActive(false);
      setIsCaliperActive(false);
      setShowHotspots(false);
      setActiveHotspot(null);
    }
  }, [isOpen, imageUrl]);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((prev) => Math.min(3.5, +(prev + 0.25).toFixed(2)));
      } else if (e.key === '-') {
        setZoomLevel((prev) => Math.max(0.6, +(prev - 0.25).toFixed(2)));
      } else if (e.key === '0') {
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  // Caliper Calculation: 25 mm/s paper speed standard.
  // 1 mm small square = 0.04s = 40 ms.
  // Assuming a baseline calibration of ~2.5 ms per screen pixel at 1x zoom
  const caliperPx = Math.abs(caliperEnd.x - caliperStart.x);
  const caliperMs = Math.round(caliperPx * 2.2);
  const caliperMm = Math.round(caliperPx / 4.5);

  let caliperInterpretation = 'Calipers Ready';
  let caliperColor = 'text-cyan-300';
  if (caliperMs >= 60 && caliperMs <= 110) {
    caliperInterpretation = 'Normal QRS Duration (60-110 ms)';
    caliperColor = 'text-emerald-400';
  } else if (caliperMs > 110 && caliperMs <= 140) {
    caliperInterpretation = 'Borderline / Broad QRS (Possible Bundle Branch Block)';
    caliperColor = 'text-amber-400';
  } else if (caliperMs >= 120 && caliperMs <= 200) {
    caliperInterpretation = 'Normal PR Interval (120-200 ms: 3-5 small boxes)';
    caliperColor = 'text-emerald-400';
  } else if (caliperMs > 200 && caliperMs <= 320) {
    caliperInterpretation = 'Prolonged PR Interval (1st Degree AV Block if >200ms)';
    caliperColor = 'text-rose-400';
  } else if (caliperMs >= 350 && caliperMs <= 460) {
    caliperInterpretation = 'Normal QTc Window (approx 360-440 ms)';
    caliperColor = 'text-teal-400';
  } else if (caliperMs > 460) {
    caliperInterpretation = 'Prolonged QT Interval (Risk of Torsades de Pointes)';
    caliperColor = 'text-rose-400';
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggingHandle) return;
    if (zoomLevel <= 1 && !isCaliperActive) return;
    if (isCaliperActive) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingHandle && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      if (draggingHandle === 'start') {
        setCaliperStart({ x: Math.max(20, Math.min(rect.width - 20, currentX)), y: caliperStart.y });
      } else if (draggingHandle === 'end') {
        setCaliperEnd({ x: Math.max(20, Math.min(rect.width - 20, currentX)), y: caliperEnd.y });
      } else if (draggingHandle === 'both') {
        const dx = currentX - dragOffset.x;
        const width = caliperEnd.x - caliperStart.x;
        setCaliperStart({ x: currentX, y: currentY });
        setCaliperEnd({ x: currentX + width, y: currentY });
      }
      return;
    }

    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingHandle(null);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoomLevel((prev) => Math.max(0.6, Math.min(4, +(prev + zoomDelta).toFixed(2))));
  };

  // Touch pinch-to-zoom
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

      if (lastTouchDistanceRef.current !== null) {
        const delta = (distance - lastTouchDistanceRef.current) * 0.01;
        setZoomLevel((prev) => Math.max(0.6, Math.min(4, +(prev + delta).toFixed(2))));
      }
      lastTouchDistanceRef.current = distance;
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistanceRef.current = null;
    setDraggingHandle(null);
  };

  const displayCategory = imageAsset?.imageCategory
    ? imageAsset.imageCategory.toUpperCase()
    : 'CLINICAL IMAGE';

  // Compute filter styling
  let imageFilter = 'none';
  if (isHighContrast) imageFilter = 'contrast(170%) brightness(105%)';
  if (isInvertedXray) imageFilter = 'invert(100%) hue-rotate(180%) contrast(150%)';

  return (
    <Modal
      open={isOpen}
      onOpenChange={(o) => !o && onClose()}
      variant="fullscreen"
      accent="var(--color-mentor)"
      title={title || imageAsset?.medicalFinding || 'High-Yield Medical Image Finding'}
      hideClose
    >
      <div
        data-surface="darkroom"
        className="flex h-full min-h-0 flex-col bg-[#080B0F] select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      {/* Top Header Bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-[var(--color-surface-2)]/90 px-4 py-3 hairline-b sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 rounded-full border border-accent/30 bg-accent-tint px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-accent-ink">
            {displayCategory}
          </span>
          <div className="min-w-0">
            <h3 className="t-title-sm line-clamp-1 text-[var(--color-ink)]">
              {title || imageAsset?.medicalFinding || 'High-Yield Medical Image Finding'}
            </h3>
            <p className="t-caption hidden text-[var(--color-ink-3)] sm:block">
              {showAnnotated ? 'Annotated Diagnostic Review Mode' : 'Clean Exam Investigation Tracing'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Tool
            active={isCaliperActive}
            onClick={() => setIsCaliperActive(!isCaliperActive)}
            title="Draggable Digital ECG Calipers (ms / mm measure)"
          >
            <Activity className="size-3.5" />
            <span>ECG Calipers</span>
          </Tool>

          <Tool
            active={showHotspots}
            onClick={() => setShowHotspots(!showHotspots)}
            title="Highlight Pathognomonic Areas"
          >
            <Crosshair className="size-3.5" />
            <span className="hidden sm:inline">Hotspots</span>
          </Tool>

          <Tool
            active={isInvertedXray}
            onClick={() => setIsInvertedXray(!isInvertedXray)}
            title="Invert Grayscale (Radiography Bone Window)"
          >
            <Layers className="size-3.5" />
            <span className="hidden sm:inline">{isInvertedXray ? 'Standard' : 'Bone Window'}</span>
          </Tool>

          <Tool
            active={isHighContrast}
            onClick={() => setIsHighContrast(!isHighContrast)}
            title="Toggle High Contrast for ECG / Radiology inspection"
          >
            <Eye className="size-3.5" />
            <span className="hidden sm:inline">{isHighContrast ? 'Normal' : 'High Contrast'}</span>
          </Tool>

          <Tool
            active={isLoupeActive}
            onClick={() => setIsLoupeActive(!isLoupeActive)}
            title="Toggle 2.8x Diagnostic Magnifier Loupe"
          >
            <Scan className="size-3.5" />
            <span className="hidden sm:inline">2.8x Loupe</span>
          </Tool>

          {/* Zoom stepper */}
          <div className="flex items-center gap-0.5 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-1 py-0.5">
            <ZoomButton
              onClick={() => setZoomLevel((z) => Math.max(0.6, +(z - 0.25).toFixed(2)))}
              title="Zoom Out (-)"
              label="Zoom out"
            >
              <ZoomOut className="size-4" />
            </ZoomButton>
            <span
              aria-live="polite"
              className="min-w-[3.5ch] px-1 text-center font-mono text-[13px] font-bold tabular-nums text-[var(--color-ink)]"
            >
              {Math.round(zoomLevel * 100)}%
            </span>
            <ZoomButton
              onClick={() => setZoomLevel((z) => Math.min(3.5, +(z + 0.25).toFixed(2)))}
              title="Zoom In (+)"
              label="Zoom in"
            >
              <ZoomIn className="size-4" />
            </ZoomButton>
            <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-[var(--color-hairline)]" />
            <ZoomButton
              onClick={() => {
                setZoomLevel(1);
                setPosition({ x: 0, y: 0 });
              }}
              title="Reset View (0)"
              label="Reset view"
            >
              <RotateCcw className="size-4" />
            </ZoomButton>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close image viewer"
            title="Close (Esc)"
            className="hit-expand ml-1 grid size-11 shrink-0 place-items-center rounded-xl text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="size-5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Wheel Zoom & Pan */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className={`relative flex min-h-0 flex-1 items-stretch justify-center overflow-hidden p-4 sm:p-6 ${
          zoomLevel > 1 && !isCaliperActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => {
          if (zoomLevel === 1) {
            setZoomLevel(1.8);
          } else {
            setZoomLevel(1);
            setPosition({ x: 0, y: 0 });
          }
        }}
      >
        <div
          /*
           * Fills the viewport rather than shrink-wrapping the image.
           * Every asset in /assets/medical-images is an SVG declared
           * `width="100%" height="100%"`, so its percentages resolve against
           * the <img>'s content box — and an auto-sized box has no definite
           * size for them to resolve against, collapsing the image to 0x0.
           * A definite box plus `object-contain` letterboxes instead.
           */
          className="relative h-full w-full transition-transform duration-100 ease-out origin-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
            filter: imageFilter,
          }}
        >
          <img
            ref={imageRef}
            src={activeSrc}
            alt={title || imageAsset?.medicalFinding || 'FMGE Medical Image'}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            className="h-full w-full select-none object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('/assets/medical-images/')) {
                target.src = '/assets/medical-images/ecg-inferior-stemi.svg';
              }
            }}
            onMouseEnter={() => setIsHoveringImage(true)}
            onMouseLeave={() => setIsHoveringImage(false)}
            onMouseMove={(e) => {
              if (!imageRef.current) return;
              const rect = imageRef.current.getBoundingClientRect();
              const x = e.clientX;
              const y = e.clientY;
              const relX = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
              const relY = Math.max(0, Math.min(100, ((y - rect.top) / rect.height) * 100));
              setLoupePos({ x, y, relX, relY });
            }}
            draggable={false}
          />

          {/* Interactive Pathology Hotspot Pins */}
          {showHotspots && (
            <>
              <div
                className="absolute top-[40%] left-[45%] z-20 group cursor-pointer"
                onClick={() => setActiveHotspot('Primary Pathognomonic Lesion: Hallmark diagnostic pattern')}
              >
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 border-2 border-white items-center justify-center shadow-lg">
                    <Crosshair className="w-3 h-3 text-slate-950 font-bold" />
                  </span>
                </div>
                <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-amber-400/40 bg-black/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xl group-hover:block">
                  Primary Pathognomonic Finding
                </div>
              </div>

              <div
                className="absolute top-[60%] left-[55%] z-20 group cursor-pointer"
                onClick={() => setActiveHotspot('Secondary Diagnostic Sign: Classical reciprocal change')}
              >
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-400 border-2 border-white items-center justify-center shadow-lg" />
                </div>
                <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-teal-400/40 bg-black/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xl group-hover:block">
                  Secondary Associated Sign
                </div>
              </div>
            </>
          )}
        </div>

        {/* Digital ECG Calipers Overlay */}
        {isCaliperActive && (
          <div className="absolute inset-0 pointer-events-none z-30">
            <svg className="w-full h-full">
              {/* Horizontal Connecting Bracket Line */}
              <line
                x1={caliperStart.x}
                y1={caliperStart.y}
                x2={caliperEnd.x}
                y2={caliperEnd.y}
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />

              {/* Left Caliper Needle */}
              <line
                x1={caliperStart.x}
                y1={caliperStart.y - 70}
                x2={caliperStart.x}
                y2={caliperStart.y + 70}
                stroke="#06b6d4"
                strokeWidth="2"
              />

              {/* Right Caliper Needle */}
              <line
                x1={caliperEnd.x}
                y1={caliperEnd.y - 70}
                x2={caliperEnd.x}
                y2={caliperEnd.y + 70}
                stroke="#06b6d4"
                strokeWidth="2"
              />
            </svg>

            {/* Draggable Left Handle */}
            <div
              className="absolute pointer-events-auto cursor-ew-resize -translate-x-1/2 -translate-y-1/2"
              style={{ left: caliperStart.x, top: caliperStart.y }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggingHandle('start');
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setDraggingHandle('start');
              }}
            >
              <div className="h-8 w-8 rounded-full bg-cyan-500/80 border-2 border-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
                <MoveHorizontal className="h-3.5 w-3.5 text-slate-950 font-bold" />
              </div>
            </div>

            {/* Draggable Right Handle */}
            <div
              className="absolute pointer-events-auto cursor-ew-resize -translate-x-1/2 -translate-y-1/2"
              style={{ left: caliperEnd.x, top: caliperEnd.y }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggingHandle('end');
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setDraggingHandle('end');
              }}
            >
              <div className="h-8 w-8 rounded-full bg-cyan-500/80 border-2 border-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
                <MoveHorizontal className="h-3.5 w-3.5 text-slate-950 font-bold" />
              </div>
            </div>

            {/* Caliper Floating HUD Banner */}
            <div
              className="absolute pointer-events-auto -translate-x-1/2 bg-slate-900/90 border border-cyan-400/50 rounded-2xl px-4 py-2 text-white shadow-2xl backdrop-blur-md flex items-center gap-3"
              style={{
                left: (caliperStart.x + caliperEnd.x) / 2,
                top: Math.min(caliperStart.y, caliperEnd.y) - 60,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  setDragOffset({ x: e.clientX - rect.left - caliperStart.x, y: e.clientY - rect.top - caliperStart.y });
                  setDraggingHandle('both');
                }
              }}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-cyan-300">
                    {caliperMs} ms
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({caliperMm} mm / small squares)
                  </span>
                </div>
                <span className={`text-[11px] font-semibold ${caliperColor}`}>
                  {caliperInterpretation}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Banner */}
      <div className="flex shrink-0 flex-col justify-between gap-2.5 bg-[var(--color-surface-2)]/90 px-4 py-3 hairline-t sm:px-6 md:flex-row md:items-center">
        <div className="flex items-start gap-2 md:items-center">
          <Eye aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent md:mt-0" />
          <p className="t-caption text-[var(--color-ink-2)]">
            <span className="font-semibold text-[var(--color-ink)]">Visual Clue: </span>
            {activeHotspot ||
              whatToLookFor ||
              imageAsset?.whatToLookFor ||
              'Observe morphological patterns and clinical signs carefully.'}
          </p>
        </div>

        {imageAsset && (
          <div className="t-caption flex shrink-0 flex-wrap items-center gap-3 text-[var(--color-ink-3)]">
            <span className="flex items-center gap-1">
              <ShieldCheck aria-hidden="true" className="size-3.5 text-[var(--color-pass-ink)]" />
              {imageAsset.license || 'Verified Educational Asset'}
            </span>
            {imageAsset.sourceUrl && (
              <a
                href={imageAsset.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span>{imageAsset.sourceName || 'Source Archive'}</span>
                <ExternalLink aria-hidden="true" className="size-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Interactive 2.8x Circular Loupe Magnifier */}
      {isLoupeActive && isHoveringImage && (
        <div
          className="pointer-events-none fixed z-tooltip overflow-hidden rounded-full border-2 border-emerald-400 shadow-2xl"
          style={{
            width: 170,
            height: 170,
            left: loupePos.x - 85,
            top: loupePos.y - 85,
            backgroundImage: `url(${activeSrc})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${320}%`,
            backgroundPosition: `${loupePos.relX}% ${loupePos.relY}%`,
            boxShadow: '0 0 28px rgba(16, 185, 129, 0.4), inset 0 0 16px rgba(0,0,0,0.5)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full border border-emerald-400 bg-emerald-400/40" />
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/80 text-[11px] font-mono font-bold text-emerald-300 tracking-wider">
            2.8x LOUPE
          </div>
        </div>
      )}
      </div>
    </Modal>
  );
};

export const InteractiveImageLightboxModal = MedicalImageViewerModal;
