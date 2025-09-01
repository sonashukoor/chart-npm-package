import React, { useEffect, useRef, useState, useId } from "react";

export type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  animate?: boolean;
  showDots?: boolean;
  gradientColors?: [string, string]; // [startColor, endColor]
  showTooltip?: boolean;
  backgroundColor?: string; // chart background
};

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 300,
  height = 100,
  strokeWidth = 3,
  animate = true,
  showDots = true,
  gradientColors = ["#1e90ff", "#9b59b6"],
  showTooltip = true,
  backgroundColor,
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const uniqueId = useId();

  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const scaleX = (i: number) => (i / (data.length - 1)) * width;
  const scaleY = (val: number) =>
    max === min ? height / 2 : height - ((val - min) / (max - min)) * height;

  const points = data.map((val, i) => [scaleX(i), scaleY(val)]);

  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    d += ` L ${x},${y}`;
  }

  useEffect(() => {
    if (animate && pathRef.current) {
      const path = pathRef.current;
      const length = path.getTotalLength();
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
      path.getBoundingClientRect(); // trigger layout
      path.style.transition = "stroke-dashoffset 1.5s ease";
      path.style.strokeDashoffset = "0";
    }
  }, [animate, data]);

  const bgColor = backgroundColor || "#f5f5f5";

  const getContrastColor = (bg: string) => {
    const c = bg.startsWith("#") ? bg.slice(1) : bg;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000" : "#fff";
  };

  const tooltipTextColor = getContrastColor(bgColor);
  const tooltipBgColor = tooltipTextColor === "#fff" ? "#333" : "#fff";

  return (
    <svg
      width={width}
      height={height}
      style={{ overflow: "visible" }}
      onMouseMove={(e) => {
        if (!showTooltip) return;
        const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const nearestIndex = Math.min(
          data.length - 1,
          Math.max(0, Math.round((x / width) * (data.length - 1)))
        );
        setHoverIndex(nearestIndex);
      }}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <defs>
        {/* Stroke gradient */}
        <linearGradient id={`${uniqueId}-stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={gradientColors[0]} />
          <stop offset="100%" stopColor={gradientColors[1]} />
        </linearGradient>

        {/* Fill gradient under line */}
        <linearGradient id={`${uniqueId}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradientColors[0]} stopOpacity={0.25} />
          <stop offset="100%" stopColor={gradientColors[1]} stopOpacity={0} />
        </linearGradient>

        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background rectangle */}
      <rect width={width} height={height} fill={bgColor} />

      {/* Gradient fill under the line */}
      <path d={`${d} L ${width},${height} L 0,${height} Z`} fill={`url(#${uniqueId}-fill)`} />

      {/* Main line */}
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={`url(#${uniqueId}-stroke)`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        filter={`url(#${uniqueId}-glow)`}
      />

      {/* Dots at edges */}
      {showDots && (
        <>
          <circle cx={points[0][0]} cy={points[0][1]} r={strokeWidth * 1.2} fill={gradientColors[0]} />
          <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r={strokeWidth * 1.2} fill={gradientColors[1]} />
        </>
      )}

      {/* Hover dot */}
      {showTooltip && hoverIndex !== null && (
        <>
          <circle
            cx={points[hoverIndex][0]}
            cy={points[hoverIndex][1]}
            r={strokeWidth * 1.5}
            fill={tooltipTextColor}
            stroke={gradientColors[1]}
            strokeWidth={2}
            pointerEvents="none"
          />

          {/* Tooltip above the dot */}
          <g
            transform={`translate(${points[hoverIndex][0]}, ${points[hoverIndex][1] - strokeWidth * 6})`}
            pointerEvents="none"
          >
            <rect x={-20} y={-12} width={40} height={16} fill={tooltipBgColor} opacity={0.85} rx={4} ry={4} />
            <text
              x={0}
              y={0}
              fill={tooltipTextColor}
              fontSize={12}
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {data[hoverIndex]}
            </text>
          </g>
        </>
      )}
    </svg>
  );
};
