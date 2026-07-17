import React from "react";
import { motion } from "framer-motion";

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-ivory-100">
      {/* 1. Subtle Animated Technical Grid (Architectural Blueprint Feel) */}
      <motion.div
        className="absolute inset-0 opacity-[0.035]"
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
        className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-slate-900/[0.04] blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-[30%] -right-[15%] w-[700px] h-[700px] rounded-full bg-amber-500/[0.05] blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -50, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-[20%] left-[25%] w-[650px] h-[650px] rounded-full bg-slate-900/[0.03] blur-3xl"
        animate={{
          scale: [1.1, 0.95, 1.1],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 3. Floating 3D Geometric Isometric Cubes & AST Nodes (Shadowed 3D Animation) */}
      {/* 3D Cube 1 — Top Right Sandbox Isolate */}
      <motion.div
        className="absolute top-[15%] right-[12%] w-24 h-24 rounded-2xl border border-slate-900/10 bg-white/60 backdrop-blur-md shadow-[0_20px_50px_rgba(20,20,19,0.08)] flex items-center justify-center transform -rotate-12"
        animate={{
          y: [-12, 12, -12],
          rotate: [-12, -5, -12],
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-12 h-12 rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-inner flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
        </div>
      </motion.div>

      {/* 3D Cube 2 — Left Center AST Node */}
      <motion.div
        className="absolute top-[45%] left-[6%] w-20 h-20 rounded-2xl border border-slate-900/10 bg-white/70 backdrop-blur-md shadow-[0_25px_60px_rgba(20,20,19,0.07)] flex items-center justify-center transform rotate-6"
        animate={{
          y: [15, -15, 15],
          rotate: [6, 14, 6],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-10 h-10 rounded-lg border border-slate-900/20 bg-slate-900/5 flex items-center justify-center">
          <div className="w-3 h-3 rounded-sm bg-slate-900" />
        </div>
      </motion.div>

      {/* 3D Cube 3 — Bottom Right Neural Block */}
      <motion.div
        className="absolute bottom-[25%] right-[18%] w-16 h-16 rounded-xl border border-amber-500/20 bg-amber-100/40 backdrop-blur-md shadow-[0_15px_35px_rgba(245,158,11,0.12)] flex items-center justify-center transform -rotate-6"
        animate={{
          y: [-10, 15, -10],
          rotate: [-6, 3, -6],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-6 h-6 rounded-md border border-amber-500/40 bg-amber-500/20" />
      </motion.div>

      {/* 4. Subliminal Floating Architectural Crosshairs (+) for ZPD/EDM Depth */}
      <motion.div
        className="absolute top-[25%] left-[28%] text-slate-900/15 font-mono text-xl select-none"
        animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        +
      </motion.div>
      <motion.div
        className="absolute bottom-[35%] left-[45%] text-amber-600/20 font-mono text-2xl select-none"
        animate={{ opacity: [0.1, 0.3, 0.1], rotate: [0, 90, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      >
        +
      </motion.div>
      <motion.div
        className="absolute top-[65%] right-[32%] text-slate-900/15 font-mono text-xl select-none"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity }}
      >
        +
      </motion.div>
    </div>
  );
};
