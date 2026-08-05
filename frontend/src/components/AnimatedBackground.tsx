import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useScroll } from "framer-motion";

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const { scrollY } = useScroll();
  const scrollProgress = useTransform(scrollY, [0, 3000], [0, 1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let time = 0;
    let mx = 0.5;
    let my = 0.5;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      mx = e.clientX / width;
      my = e.clientY / height;
      mouseX.set(mx);
      mouseY.set(my);
    };
    window.addEventListener("mousemove", handleMouse);

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseX: number;
      baseY: number;
    }

    const nodes: Node[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2 + 1,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
    }));

    const draw = () => {
      time += 0.003;
      ctx.clearRect(0, 0, width, height);

      const scroll = scrollProgress.get();
      const hueShift = scroll * 30;

      nodes.forEach((node) => {
        const pullX = (mx - 0.5) * 80;
        const pullY = (my - 0.5) * 80;

        node.x += node.vx + Math.sin(time + node.baseX * 0.01) * 0.4;
        node.y += node.vy + Math.cos(time + node.baseY * 0.01) * 0.4;

        node.x += (node.baseX + pullX - node.x) * 0.005;
        node.y += (node.baseY + pullY - node.y) * 0.005;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;
      });

      const maxDist = 180;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.08;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(20, 20, 19, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        const glow = 0.12 + Math.sin(time * 2 + node.baseX) * 0.05;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(20, 20, 19, ${glow})`;
        ctx.fill();
      });

      const gx = width * 0.5 + Math.sin(time * 0.7) * width * 0.2 + (mx - 0.5) * 200;
      const gy = height * 0.4 + Math.cos(time * 0.5) * height * 0.15 + (my - 0.5) * 150;
      const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, 500);
      gradient.addColorStop(0, `hsla(${38 + hueShift}, 70%, 55%, 0.04)`);
      gradient.addColorStop(0.5, `hsla(${38 + hueShift}, 60%, 50%, 0.02)`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const g2x = width * 0.7 + Math.cos(time * 0.4) * width * 0.15;
      const g2y = height * 0.7 + Math.sin(time * 0.6) * height * 0.1;
      const gradient2 = ctx.createRadialGradient(g2x, g2y, 0, g2x, g2y, 400);
      gradient2.addColorStop(0, `hsla(${220 + hueShift}, 30%, 40%, 0.025)`);
      gradient2.addColorStop(1, "transparent");
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, width, height);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, [mouseX, mouseY, scrollProgress]);

  const meshRotate = useTransform(scrollY, [0, 2000], [0, 15]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-ivory-100">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.9 }}
      />

      <motion.div
        className="absolute inset-0"
        style={{ rotate: meshRotate }}
      >
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[120px] transform-gpu"
          style={{
            background: "radial-gradient(circle, rgba(217,119,6,0.06) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 60, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[100px] transform-gpu"
          style={{
            background: "radial-gradient(circle, rgba(20,20,19,0.04) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1.1, 0.9, 1.1],
            x: [0, -40, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
};
