import { useEffect, useRef } from "react";

/**
 * Yoast-style SEO Score Meter Component
 * Displays circular progress with color-coded score
 */
export default function SeoScoreMeter({ score = 0, size = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - 20) / 2;
    const lineWidth = 8;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Determine color based on score
    let color;
    if (score < 50) {
      color = "#ef4444"; // Red
    } else if (score < 80) {
      color = "#f59e0b"; // Yellow/Orange
    } else {
      color = "#10b981"; // Green
    }

    // Draw progress arc
    const progress = score / 100;
    const startAngle = -Math.PI / 2; // Start at top
    const endAngle = startAngle + 2 * Math.PI * progress;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Draw score text
    ctx.fillStyle = "#1f2937";
    ctx.font = `bold ${size * 0.25}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(score, centerX, centerY - size * 0.05);

    // Draw label
    ctx.fillStyle = "#6b7280";
    ctx.font = `${size * 0.1}px system-ui, -apple-system, sans-serif`;
    ctx.fillText("SEO Score", centerX, centerY + size * 0.15);
  }, [score, size]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="block"
      />
    </div>
  );
}

