import RevealOnScroll from "./RevealOnScroll";

export default function TrustBadges() {
  const badges = [
    <div
      key="tp-1"
      className="flex items-center justify-center gap-2 min-w-[200px]"
    >
      <span className="font-black text-2xl text-on-surface">Tripay</span>
    </div>,
    <div
      key="wa-1"
      className="flex items-center justify-center gap-2 min-w-[250px]"
    >
      <span
        className="material-symbols-outlined text-primary-dim"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        verified
      </span>
      <span className="font-bold text-xl text-on-surface">
        WhatsApp Official
      </span>
    </div>,
    <div
      key="pd-1"
      className="flex items-center justify-center gap-2 min-w-[200px]"
    >
      <span className="font-bold text-2xl text-on-surface">Padelindo</span>
    </div>,
    <div
      key="ss-1"
      className="flex items-center justify-center gap-2 min-w-[250px]"
    >
      <span className="font-black italic text-2xl text-on-surface">
        SemarangSport
      </span>
    </div>,
    <div
      key="spc-1"
      className="flex items-center justify-center gap-2 min-w-[280px]"
    >
      <span className="font-black text-2xl text-on-surface">
        Semarang Padel Center
      </span>
    </div>,
    // Duplicate to ensure seamless scrolling
    <div
      key="tp-2"
      className="flex items-center justify-center gap-2 min-w-[200px] md:hidden lg:flex"
    >
      <span className="font-black text-2xl text-on-surface">Tripay</span>
    </div>,
    <div
      key="wa-2"
      className="flex items-center justify-center gap-2 min-w-[250px] md:hidden lg:flex"
    >
      <span
        className="material-symbols-outlined text-primary-dim"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        verified
      </span>
      <span className="font-bold text-xl text-on-surface">
        WhatsApp Official
      </span>
    </div>,
  ];

  return (
    <RevealOnScroll className="relative z-20 -mt-10 bg-transparent border-y border-white/60 backdrop-blur-xl py-6 overflow-hidden shadow-sm">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-scroll {
          animation: marquee 20s linear infinite;
          display: flex;
          width: max-content;
        }
        .animate-marquee-scroll:hover {
          animation-play-state: paused;
        }
      `,
        }}
      />
      <div className="relative w-full max-w-full">
        <div className="animate-marquee-scroll space-x-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {/* First set */}
          {badges.map((b, i) => (
            <div
              key={`set1-${i}`}
              className="hover:scale-105 transition-transform duration-300"
            >
              {b}
            </div>
          ))}
          {/* Second set for seamless looping */}
          {badges.map((b, i) => (
            <div
              key={`set2-${i}`}
              className="hover:scale-105 transition-transform duration-300"
            >
              {b}
            </div>
          ))}
        </div>
      </div>
    </RevealOnScroll>
  );
}
