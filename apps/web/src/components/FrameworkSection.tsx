export default function FrameworkSection() {
  return (
    <div className="pt-16 pb-8 px-6 bg-transparent">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-xs font-bold tracking-widest uppercase text-gray-600 mb-8">
          Works seamlessly with your favorite frameworks
        </h2>

        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 text-gray-800">
          {/* Next.js Logo */}
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <svg
              viewBox="0 0 180 36"
              height="22"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M110.19 14.84c-3.15 0-4.99 1.63-4.99 4.31 0 2.53 1.63 4.16 5 4.16 1.74 0 3.15-.47 4.05-1.21l.68 1.52c-1.21.95-3.05 1.47-5.05 1.47-4.47 0-6.94-2.47-6.94-5.94 0-3.52 2.63-6.05 6.84-6.05 1.68 0 3.31.53 4.52 1.52l-.84 1.47c-1-.79-2.31-1.26-3.26-1.26zm14.36 10.04h2.21l-4.1-6.1 4-5.63h-2.36l-2.84 4.16-2.79-4.16h-2.31l4 5.73-4.1 6h2.42l2.89-4.31 2.98 4.31zm16.57-2.1c-.84.84-2.1 1.37-3.47 1.37-2.15 0-3.36-1.1-3.63-2.89h10.46v-1.1c0-3.68-2.1-5.78-5.31-5.78-3.42 0-5.42 2.37-5.42 5.84 0 3.52 2.21 5.94 5.78 5.94 1.79 0 3.37-.63 4.47-1.63l-2.89-1.74zm-3.52-5.94c1.68 0 2.89 1.05 3.05 2.52h-6.2c.31-1.63 1.42-2.52 3.15-2.52zm11.73 8.04V15h-2.1v9.88h2.1zm-1.05-11.88a1.35 1.35 0 01-1.37 1.36 1.35 1.35 0 010-2.72c.8 0 1.37.64 1.37 1.36zm14.83 11.98c1.63 0 2.73-.58 3.42-1.32l-.68-1.52c-.58.53-1.42.89-2.58.89-1.79 0-3.1-1-3.1-3.21v-4.57h3.63v-1.84h-3.63V9.67h-2.1v4.47h-2.1v1.84h2.1v4.84c0 2.89 1.68 4.15 4.04 4.15zm8.41-11.83c3.42 0 5.05 1.79 5.05 5.57v6.2h-2.1v-5.83c0-2.89-.95-4-3.1-4-2.21 0-3.63 1.16-3.63 3.63v6.2h-2.1v-9.88h2.1v1.31c.74-1.1 2.05-1.52 3.78-1.52V13.1z" />
              <path
                d="M57.9 22.95l-4.55-5.93c.1-.88.15-1.78.15-2.68 0-7.91-6.42-14.34-14.34-14.34S24.82 6.43 24.82 14.34s6.42 14.34 14.34 14.34c3.43 0 6.57-1.2 9.03-3.2l5.05 6.59 4.66-9.12zm-18.74-2.87V9.75h2.1v8.83l6.57 8.56c-2.45 1.43-5.32 2.26-8.37 2.26-7.85 0-14.24-6.38-14.24-14.24s6.38-14.24 14.24-14.24 14.24 6.38 14.24 14.24c0 .87-.08 1.73-.24 2.57l-14.3-17.73z"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* React Logo */}
          <div className="flex items-center gap-2 font-semibold text-xl text-[#61DAFB] opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <svg
              viewBox="-11.5 -10.23174 23 20.46348"
              height="28"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="0" cy="0" r="2.05" />
              <g stroke="currentColor" strokeWidth="1" fill="none">
                <ellipse rx="11" ry="4.2" />
                <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                <ellipse rx="11" ry="4.2" transform="rotate(120)" />
              </g>
            </svg>
            <span className="text-gray-900 tracking-tight">React</span>
          </div>

          {/* Vue Logo */}
          <div className="flex items-center gap-2 font-semibold text-xl text-[#41B883] opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <svg viewBox="0 0 118 100" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M0 0h24L59 60l35-60h24L59 100 0 0z" />
              <path fill="#34495E" d="M24 0h24l11 19 11-19h24L59 60 24 0z" />
            </svg>
            <span className="text-gray-900 tracking-tight">Vue</span>
          </div>

          {/* Astro Logo */}
          <div className="flex items-center gap-1 font-bold text-2xl tracking-tighter [filter:none]">
            <span style={{ color: '#7c2d12' }}>astro</span>
          </div>

          {/* Nuxt Logo */}
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-[#00C58E] opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <svg viewBox="0 0 100 100" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M50 10 L90 80 L10 80 Z" opacity="0.3" />
              <path fill="currentColor" d="M60 30 L95 90 L25 90 Z" />
            </svg>
            <span className="text-gray-900">Nuxt</span>
          </div>

          {/* Python Logo */}
          <div className="flex items-center gap-2 font-semibold text-xl text-[#3776AB] opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <svg
              viewBox="0 0 448 512"
              height="28"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M439.8 200.5c-7.7-30.9-22.3-54.2-53.4-54.2h-40.1v47.4c0 36.8-31.2 67.8-68.6 67.8H172.7c-4.5 0-8.1 3.6-8.1 8.1v4.8c0 4.5 3.6 8.1 8.1 8.1h104.6c40.2 0 73.9-33.3 73.9-73.5V146.3h-40.1c-31.1 0-45.7 23.3-53.4 54.2-7.8 31.4-1.1 63.8 18.5 86.4l2.1 2.4c19.9 23 48 37.1 79.1 37.1h39.1c31.1 0 45.7-23.3 53.4-54.2 7.7-31.4 1.1-63.8-18.5-86.4l-2.1-2.4c-19.9-23-48-37.1-79.1-37.1zM282.1 407.1c-16.1 0-29.1-13-29.1-29.1 0-16.1 13-29.1 29.1-29.1s29.1 13 29.1 29.1c0 16.1-13 29.1-29.1 29.1zM111.9 220.3c-7.8-31.4-1.1-63.8 18.5-86.4l2.1-2.4c19.9-23 48-37.1 79.1-37.1h39.1c31.1 0 45.7 23.3 53.4 54.2 7.7 31.4 1.1 63.8-18.5 86.4l-2.1 2.4c-19.9 23-48 37.1-79.1 37.1h-39.1c-31.1 0-45.7-23.3-53.4-54.2zM165.9 104.9c16.1 0 29.1 13 29.1 29.1 0 16.1-13 29.1-29.1 29.1s-29.1-13-29.1-29.1c0-16.1 13-29.1 29.1-29.1z" />
            </svg>
            <span className="text-gray-900 tracking-tight">Python</span>
          </div>
        </div>
      </div>
    </div>
  );
}
