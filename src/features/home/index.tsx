"use client";

import { motion } from "motion/react";

export default function Home() {
    return (
        <div className="relative min-h-screen w-full bg-[#0d0d12] overflow-hidden flex flex-col items-center justify-center">
            {/* Top Center Blurred Triangle */}
            <motion.div
                className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[115vw] h-[90vw] max-w-[1150px] max-h-[900px] blur-[200px] sm:blur-[250px] opacity-70 pointer-events-none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
            >
                <div className="w-full h-full bg-[#4D00FF] [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
            </motion.div>

            {/* Right Blending Blob (Softens Triangle) */}
            <motion.div
                className="absolute top-[40%] right-[-15%] w-[110vw] h-[20vw] max-w-[1100px] max-h-[500px] bg-[#2E00FF] rounded-full blur-[200px] sm:blur-[250px] opacity-20 pointer-events-none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            />

            {/* Left Center Blob */}
            <motion.div
                className="absolute top-[-20%] left-[-15%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[#4C5B8B] rounded-full blur-[120px] sm:blur-[160px] opacity-40 pointer-events-none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
            />

            {/* Content Container */}
            <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center text-white">
                {/* Children content goes here */}
            </div>
        </div>
    );
}