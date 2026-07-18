import React from "react";
import { motion } from "framer-motion";

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-ivory-100 [perspective:1200px]">
      {/* 1. Subtle Animated Technical Grid (Architectural Blueprint Feel) */}
      <motion.div
        className="absolute inset-0 opacity-[0.038]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #141413 1px, transparent 1px),
            linear-gradient(to bottom, #141413 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
        animate={{
          backgroundPosition: ["0px 0px", "48px 48px"],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* 2. Soft 3D Ambient Studio Shadow Orbs (Breathing Depth & Lighting) */}
      <motion.div
        className="absolute -top-[20%] -left-[10%] w-[650px] h-[650px] rounded-full bg-slate-900/[0.045] blur-3xl transform-gpu"
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 45, 0],
          y: [0, 35, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-[28%] -right-[15%] w-[750px] h-[750px] rounded-full bg-amber-500/[0.06] blur-3xl transform-gpu"
        animate={{
          scale: [1, 1.22, 1],
          x: [0, -55, 0],
          y: [0, -45, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-[20%] left-[25%] w-[680px] h-[680px] rounded-full bg-slate-900/[0.035] blur-3xl transform-gpu"
        animate={{
          scale: [1.1, 0.95, 1.1],
          x: [0, 35, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 3. Floating 3D Geometric Isometric Data Modules & AST Nodes */}
      {/* 3D Isometric Hologram 1 — Top Right Sandbox Isolate */}
      <motion.div
        className="absolute top-[14%] right-[11%] w-28 h-28 rounded-3xl border border-slate-900/15 bg-white/75 backdrop-blur-md shadow-[0_25px_60px_rgba(20,20,19,0.09)] flex flex-col items-center justify-center transform -rotate-12 [transform-style:preserve-3d]"
        animate={{
          y: [-14, 14, -14],
          rotateX: [10, 20, 10],
          rotateY: [-15, -5, -15],
          rotateZ: [-12, -8, -12],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-14 h-14 rounded-2xl border border-amber-500/40 bg-amber-500/15 shadow-inner flex items-center justify-center">
          <motion.div
            className="w-5 h-5 rounded-full bg-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.7)]"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </div>
        <span className="text-[9px] font-mono font-bold text-slate-500 mt-2 tracking-tighter uppercase">Isolate 3D</span>
      </motion.div>

      {/* 3D Isometric Hologram 2 — Left Center AST Node */}
      <motion.div
        className="absolute top-[42%] left-[5%] w-24 h-24 rounded-2xl border border-slate-900/15 bg-white/80 backdrop-blur-md shadow-[0_25px_65px_rgba(20,20,19,0.08)] flex flex-col items-center justify-center transform rotate-6 [transform-style:preserve-3d]"
        animate={{
          y: [16, -16, 16],
          rotateX: [12, -5, 12],
          rotateY: [15, 25, 15],
          rotateZ: [6, 14, 6],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-11 h-11 rounded-xl border border-slate-900/20 bg-slate-900/10 flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-sm bg-slate-900 shadow-sm" />
        </div>
        <span className="text-[9px] font-mono font-bold text-slate-600 mt-1.5 tracking-tighter uppercase">AST Tree</span>
      </motion.div>

      {/* 3D Isometric Hologram 3 — Bottom Right Neural Block */}
      <motion.div
        className="absolute bottom-[22%] right-[16%] w-20 h-20 rounded-2xl border border-amber-500/30 bg-amber-100/50 backdrop-blur-md shadow-[0_18px_40px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center transform -rotate-6 [transform-style:preserve-3d]"
        animate={{
          y: [-12, 16, -12],
          rotateX: [15, 5, 15],
          rotateY: [-10, -20, -10],
          rotateZ: [-6, 4, -6],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-8 h-8 rounded-lg border border-amber-500/50 bg-amber-500/25 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-700" />
        </div>
        <span className="text-[8px] font-mono font-bold text-amber-900 mt-1 uppercase tracking-tight">ZPD Node</span>
      </motion.div>

      {/* 4. Subliminal Floating Architectural Crosshairs (+) & Laser Tracing Lines */}
      <motion.div
        className="absolute top-[22%] left-[26%] text-slate-900/20 font-mono text-2xl select-none"
        animate={{ opacity: [0.15, 0.4, 0.15], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        +
      </motion.div>
      <motion.div
        className="absolute bottom-[32%] left-[42%] text-amber-600/25 font-mono text-3xl select-none"
        animate={{ opacity: [0.1, 0.35, 0.1], rotate: [0, 90, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      >
        +
      </motion.div>
      <motion.div
        className="absolute top-[68%] right-[30%] text-slate-900/20 font-mono text-2xl select-none"
        animate={{ opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 7, repeat: Infinity }}
      >
        +
      </motion.div>
    </div>
  );
};
