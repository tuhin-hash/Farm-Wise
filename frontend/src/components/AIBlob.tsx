import React, { useRef, useEffect } from 'react';
import type { BlobState } from '../types';

interface AIBlobProps {
  state: BlobState;
  audioStream?: MediaStream | null;
  audioLevel?: number; // 0.0 to 1.0
  size?: number;
  className?: string;
  onClick?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const AIBlob: React.FC<AIBlobProps> = ({
  state,
  audioStream,
  audioLevel = 0,
  size = 280,
  className = '',
  onClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const smoothedAmplitudeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef<number>(0);

  // Set up Web Audio API when audioStream is provided
  useEffect(() => {
    if (!audioStream) {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (_) {}
        sourceNodeRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      source.connect(analyser);
      sourceNodeRef.current = source;
    } catch (err) {
      console.warn('Web Audio API initialization failed:', err);
    }

    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (_) {}
        sourceNodeRef.current = null;
      }
    };
  }, [audioStream]);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (_) {}
      }
    };
  }, []);

  // Initialize orbiting ambient particles
  useEffect(() => {
    const particleCount = 28;
    const particles: Particle[] = [];
    const colors = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#a7f3d0'];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (size * 0.45) + 30;
      particles.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    particlesRef.current = particles;
  }, [size]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const dataArray = new Uint8Array(128);

    const render = () => {
      timeRef.current += 0.025;
      const t = timeRef.current;

      // Calculate audio amplitude
      let rawVolume = audioLevel;
      if (analyserRef.current && state === 'LISTENING') {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 32; i++) {
          sum += dataArray[i];
        }
        rawVolume = Math.min(1.0, (sum / 32) / 128);
      } else if (state === 'SPEAKING') {
        // Natural synthetic speech modulation rhythm
        rawVolume = 0.35 + Math.sin(t * 7) * 0.2 + Math.cos(t * 13) * 0.15;
      } else if (state === 'THINKING') {
        rawVolume = 0.25 + Math.sin(t * 4) * 0.15;
      }

      // Smooth amplitude filter
      smoothedAmplitudeRef.current =
        smoothedAmplitudeRef.current * 0.8 + rawVolume * 0.2;
      const amp = smoothedAmplitudeRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;

      // Base radius by state
      let baseR = size * 0.3;
      if (state === 'LISTENING') baseR = size * (0.3 + amp * 0.08);
      else if (state === 'SPEAKING') baseR = size * (0.3 + amp * 0.06);
      else if (state === 'THINKING') baseR = size * 0.28;

      // 1. Draw outer atmospheric glow rings
      const glowGrad = ctx.createRadialGradient(cx, cy, baseR * 0.6, cx, cy, baseR * 1.55);
      if (state === 'LISTENING') {
        glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
        glowGrad.addColorStop(0.5, 'rgba(5, 150, 105, 0.2)');
        glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else if (state === 'THINKING') {
        glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
        glowGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
        glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else if (state === 'SPEAKING') {
        glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
        glowGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.25)');
        glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      } else if (state === 'ERROR') {
        glowGrad.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
        glowGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
      } else if (state === 'SUCCESS') {
        glowGrad.addColorStop(0, 'rgba(34, 197, 94, 0.55)');
        glowGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
      } else {
        // IDLE
        glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
        glowGrad.addColorStop(0.7, 'rgba(5, 150, 105, 0.08)');
        glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      }

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Orbiting/Drifting Particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Attract particles slightly towards center or orbit
        const d = Math.hypot(p.x, p.y);
        const maxDist = size * 0.44;
        if (d > maxDist || d < 20) {
          p.vx *= -1;
          p.vy *= -1;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (state === 'IDLE' ? 0.4 : 0.85);
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // 3. Generate Deformed Organic Blob Path
      const numPoints = 36;
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < numPoints; i++) {
        const theta = (i / numPoints) * Math.PI * 2;
        let r = baseR;

        if (state === 'STOPPED') {
          r = baseR;
        } else if (state === 'IDLE') {
          // Gentle breathing and organic wave
          r += Math.sin(theta * 3 + t * 1.2) * 6;
          r += Math.cos(theta * 2 - t * 0.9) * 4;
        } else if (state === 'LISTENING') {
          // Responsive mic reaction
          const deformFactor = 8 + amp * 32;
          r += Math.sin(theta * 4 + t * 3.5) * deformFactor;
          r += Math.cos(theta * 6 - t * 2.8) * (deformFactor * 0.6);
          r += Math.sin(theta * 2 + t * 1.5) * 5;
        } else if (state === 'THINKING') {
          // Rapid harmonic swirling
          r += Math.sin(theta * 5 + t * 6.0) * 12;
          r += Math.cos(theta * 3 - t * 4.5) * 10;
        } else if (state === 'SPEAKING') {
          // Vocal harmonic rhythm
          const vocalWarp = 10 + amp * 20;
          r += Math.sin(theta * 3 + t * 4.5) * vocalWarp;
          r += Math.cos(theta * 7 - t * 3.2) * (vocalWarp * 0.5);
        } else if (state === 'ERROR') {
          r += Math.sin(theta * 8 + t * 8) * 8;
        } else if (state === 'SUCCESS') {
          r += Math.sin(theta * 4 + t * 2) * (8 + Math.sin(t * 3) * 4);
        }

        points.push({
          x: cx + Math.cos(theta) * r,
          y: cy + Math.sin(theta) * r
        });
      }

      // Draw smooth Bezier spline through points
      ctx.beginPath();
      const firstMidX = (points[0].x + points[numPoints - 1].x) / 2;
      const firstMidY = (points[0].y + points[numPoints - 1].y) / 2;
      ctx.moveTo(firstMidX, firstMidY);

      for (let i = 0; i < numPoints; i++) {
        const next = points[(i + 1) % numPoints];
        const midX = (points[i].x + next.x) / 2;
        const midY = (points[i].y + next.y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }
      ctx.closePath();

      // Blob gradient fill
      const blobGrad = ctx.createRadialGradient(
        cx - baseR * 0.25,
        cy - baseR * 0.25,
        baseR * 0.1,
        cx,
        cy,
        baseR * 1.15
      );

      if (state === 'LISTENING') {
        blobGrad.addColorStop(0, '#34d399');
        blobGrad.addColorStop(0.4, '#10b981');
        blobGrad.addColorStop(0.8, '#047857');
        blobGrad.addColorStop(1, '#064e3b');
      } else if (state === 'THINKING') {
        blobGrad.addColorStop(0, '#fde68a');
        blobGrad.addColorStop(0.35, '#f59e0b');
        blobGrad.addColorStop(0.75, '#10b981');
        blobGrad.addColorStop(1, '#065f46');
      } else if (state === 'SPEAKING') {
        blobGrad.addColorStop(0, '#67e8f9');
        blobGrad.addColorStop(0.35, '#06b6d4');
        blobGrad.addColorStop(0.75, '#059669');
        blobGrad.addColorStop(1, '#064e3b');
      } else if (state === 'ERROR') {
        blobGrad.addColorStop(0, '#fca5a5');
        blobGrad.addColorStop(0.5, '#f43f5e');
        blobGrad.addColorStop(1, '#9f1239');
      } else if (state === 'SUCCESS') {
        blobGrad.addColorStop(0, '#86efac');
        blobGrad.addColorStop(0.4, '#22c55e');
        blobGrad.addColorStop(0.85, '#15803d');
        blobGrad.addColorStop(1, '#14532d');
      } else if (state === 'STOPPED') {
        blobGrad.addColorStop(0, '#94a3b8');
        blobGrad.addColorStop(0.6, '#64748b');
        blobGrad.addColorStop(1, '#334155');
      } else {
        // IDLE
        blobGrad.addColorStop(0, '#6ee7b7');
        blobGrad.addColorStop(0.4, '#10b981');
        blobGrad.addColorStop(0.8, '#059669');
        blobGrad.addColorStop(1, '#044e36');
      }

      ctx.fillStyle = blobGrad;
      ctx.fill();

      // Inner highlight gloss
      ctx.save();
      ctx.clip();
      const glossGrad = ctx.createRadialGradient(
        cx - baseR * 0.35,
        cy - baseR * 0.35,
        baseR * 0.05,
        cx - baseR * 0.3,
        cy - baseR * 0.3,
        baseR * 0.65
      );
      glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      glossGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
      glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = glossGrad;
      ctx.beginPath();
      ctx.arc(cx - baseR * 0.3, cy - baseR * 0.3, baseR * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Outer rim edge stroke
      ctx.strokeStyle =
        state === 'THINKING'
          ? 'rgba(253, 230, 138, 0.6)'
          : state === 'SPEAKING'
          ? 'rgba(165, 243, 252, 0.7)'
          : state === 'ERROR'
          ? 'rgba(254, 205, 211, 0.6)'
          : 'rgba(167, 243, 208, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, size, audioLevel]);

  const getStateBadge = () => {
    switch (state) {
      case 'LISTENING':
        return { label: 'Listening...', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', ping: 'bg-emerald-400' };
      case 'THINKING':
        return { label: 'Agents Reasoning...', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', ping: 'bg-amber-400' };
      case 'SPEAKING':
        return { label: 'Speaking Response...', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', ping: 'bg-cyan-400' };
      case 'SUCCESS':
        return { label: 'Analysis Complete', color: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40', ping: 'bg-emerald-400' };
      case 'ERROR':
        return { label: 'Attention Needed', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', ping: 'bg-rose-400' };
      case 'STOPPED':
        return { label: 'Microphone Off', color: 'bg-stone-500/20 text-stone-300 border-stone-500/40', ping: 'bg-stone-400' };
      default:
        return { label: 'Tap Mic to Speak', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', ping: 'bg-emerald-500' };
    }
  };

  const badge = getStateBadge();

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center select-none ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{ width: size, height: size + 40 }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="transition-transform duration-300 hover:scale-102"
      />

      {/* State Indicator Pill */}
      <div
        className={`mt-2 px-3 py-1 rounded-full border text-[11px] font-bold tracking-wide flex items-center gap-2 backdrop-blur-md transition-all duration-300 ${badge.color}`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.ping} ${state === 'IDLE' ? '' : 'animate-ping'}`} />
        <span>{badge.label}</span>
      </div>
    </div>
  );
};
