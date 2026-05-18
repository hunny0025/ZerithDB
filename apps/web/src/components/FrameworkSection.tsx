"use client";

import { motion } from "framer-motion";

const frameworks = [
  {
    name: "Next.js",
    icon: (
      <svg
        viewBox="0 0 394 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path
          fill="currentColor"
          d="M262 0h68.5v12.7h-27.2v66.6h-13.6V12.7H262V0ZM149 0v12.7H94v20.4h44.3v12.6H94v21h55v12.6H80.5V0h68.7zm34.3 0h-17.8l63.8 79.4h17.9l-32-39.7 32-39.6h-17.9l-23 28.6-23-28.6zm18.3 56.7-9-11-27.1 33.7h17.8l18.3-22.7z"
        />
        <path
          fill="currentColor"
          d="M81 79.3 17 0H0v79.3h13.6V17l50.2 62.3H81Z"
        />
      </svg>
    ),
    color: "#ffffff",
    size: "w-24 h-8",
  },
  {
    name: "React",
    icon: (
      <svg
        viewBox="-11.5 -10.23174 23 20.46348"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <circle cx="0" cy="0" r="2.05" />
        <g stroke="currentColor" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    ),
    color: "#61DAFB",
    size: "w-12 h-12",
  },
  {
    name: "Vue",
    icon: (
      <svg
        viewBox="0 0 118 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path fill="currentColor" d="M0 0h24L59 60l35-60h24L59 100 0 0z" />
        <path fill="#34495E" d="M24 0h24l11 19 11-19h24L59 60 24 0z" />
      </svg>
    ),
    color: "#41B883",
    size: "w-12 h-10",
  },
  {
    name: "Astro",
    icon: (
      <span className="font-bold tracking-tighter text-orange-500 dark:text-orange-400">
        astro
      </span>
    ),
    color: "#FF5D01",
    size: "text-3xl font-bold tracking-tighter",
  },
  {
    name: "Nuxt",
    icon: (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path fill="currentColor" d="M50 10 L90 80 L10 80 Z" opacity="0.3" />
        <path fill="currentColor" d="M60 30 L95 90 L25 90 Z" />
      </svg>
    ),
    color: "#00C58E",
    size: "w-12 h-10",
  },
  {
    name: "Python",
    icon: (
      <svg
        viewBox="0 0 448 512"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path d="M439.8 200.5c-7.7-30.9-22.3-54.2-53.4-54.2h-40.1v47.4c0 36.8-31.2 67.8-68.6 67.8H172.7c-4.5 0-8.1 3.6-8.1 8.1v4.8c0 4.5 3.6 8.1 8.1 8.1h104.6c40.2 0 73.9-33.3 73.9-73.5V146.3h-40.1c-31.1 0-45.7 23.3-53.4 54.2-7.8 31.4-1.1 63.8 18.5 86.4l2.1 2.4c19.9 23 48 37.1 79.1 37.1h39.1c31.1 0 45.7-23.3 53.4-54.2 7.7-31.4 1.1-63.8-18.5-86.4l-2.1-2.4c-19.9-23-48-37.1-79.1-37.1z" />
      </svg>
    ),
    color: "#3776AB",
    size: "w-12 h-12",
  },
];

export default function FrameworkSection() {
  return (
    <div className="py-20 px-6 relative bg-transparent theme-transition">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-900/20 rounded-full blur-[120px]" />

        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
            Works seamlessly with your favorite frameworks
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {frameworks.map((fw, index) => (
            <motion.div
              key={fw.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{
                y: -8,
                scale: 1.03,
              }}
              className="group relative flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[1.8rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.45)] transition-all duration-500 min-h-[220px]"
            >
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.5,
                }}
                className="flex flex-col items-center"
              >
                <div
                  className={`mb-5 flex items-center justify-center ${fw.size}`}
                  style={{ color: fw.color }}
                >
                  {fw.icon}
                </div>

                <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight theme-transition">
                  {fw.name}
                </span>
              </motion.div>

              <div
                className="absolute inset-0 rounded-[1.8rem] opacity-0 group-hover:opacity-[0.04] dark:group-hover:opacity-[0.08] transition-opacity duration-500"
                style={{ backgroundColor: fw.color }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}