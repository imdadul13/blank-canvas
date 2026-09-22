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
import { createPortal } from 'react-dom';
import { MedicalImageAsset } from '../types';

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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200 select-none font-['Plus_Jakarta_Sans']"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-white/10 text-white shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-[10px] sm:text-[11px] font-bold tracking-wider font-mono">
            {displayCategory}
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold font-['Outfit'] text-white line-clamp-1">
              {title || imageAsset?.medicalFinding || 'High-Yield Medical Image Finding'}
            </h3>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {showAnnotated ? 'Annotated Diagnostic Review Mode' : 'Clean Exam Investigation Tracing'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* ECG Caliper Tool Toggle */}
          <button
            type="button"
            onClick={() => setIsCaliperActive(!isCaliperActive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              isCaliperActive
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Draggable Digital ECG Calipers (ms / mm measure)"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>ECG Calipers</span>
          </button>

          {/* Pathology Hotspots Toggle */}
          <button
            type="button"
            onClick={() => setShowHotspots(!showHotspots)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              showHotspots
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Highlight Pathognomonic Areas"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pathology Hotspots</span>
          </button>

          {/* Invert X-Ray / Bone Window */}
          <button
            type="button"
            onClick={() => setIsInvertedXray(!isInvertedXray)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              isInvertedXray
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Invert Grayscale (Radiography Bone Window)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isInvertedXray ? 'Standard' : 'Bone Window'}</span>
          </button>

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={() => setIsHighContrast(!isHighContrast)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              isHighContrast
                ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle High Contrast for ECG / Radiology inspection"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isHighContrast ? 'Normal Contrast' : 'High Contrast'}</span>
          </button>

          {/* 2.8x Diagnostic Loupe Tool */}
          <button
            type="button"
            onClick={() => setIsLoupeActive(!isLoupeActive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              isLoupeActive
                ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle 2.8x Diagnostic Magnifier Loupe"
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2.8x Loupe</span>
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 text-slate-300">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, +(z - 0.25).toFixed(2)))}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-xs font-bold text-slate-200">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(3.5, +(z + 0.25).toFixed(2)))}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomLevel(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors border-l border-slate-700 ml-1 cursor-pointer"
              title="Reset View (0)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Wheel Zoom & Pan */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className={`flex-1 overflow-hidden relative flex items-center justify-center p-4 sm:p-6 ${
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
          className="relative transition-transform duration-100 ease-out origin-center"
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
            className="max-h-[70vh] max-w-[92vw] object-contain rounded-xl shadow-2xl select-none"
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
                <div className="absolute left-1/2 -translate-x-1/2 bottom-7 hidden group-hover:block bg-black/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-amber-400/40 whitespace-nowrap shadow-xl">
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
                <div className="absolute left-1/2 -translate-x-1/2 bottom-6 hidden group-hover:block bg-black/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-teal-400/40 whitespace-nowrap shadow-xl">
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
                  <span className="text-[10px] text-slate-400 font-mono">
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
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 sm:px-6 py-3 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-start md:items-center gap-2">
          <Eye className="w-4 h-4 text-teal-400 shrink-0 mt-0.5 md:mt-0" />
          <div>
            <span className="font-bold text-white font-['Outfit'] mr-1">Visual Clue:</span>
            <span>
              {activeHotspot || whatToLookFor || imageAsset?.whatToLookFor || 'Observe morphological patterns and clinical signs carefully.'}
            </span>
          </div>
        </div>

        {imageAsset && (
          <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {imageAsset.license || 'Verified Educational Asset'}
            </span>
            {imageAsset.sourceUrl && (
              <a
                href={imageAsset.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>{imageAsset.sourceName || 'Source Archive'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Interactive 2.8x Circular Loupe Magnifier */}
      {isLoupeActive && isHoveringImage && (
        <div
          className="fixed pointer-events-none z-[120] rounded-full border-2 border-emerald-400 shadow-2xl overflow-hidden"
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
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-emerald-300 tracking-wider">
            2.8x LOUPE
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export const InteractiveImageLightboxModal = MedicalImageViewerModal;
