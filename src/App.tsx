import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import voidLogo from "@/imports/image.png";

function VoidLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale = size === "lg" ? 1 : size === "sm" ? 0.45 : 0.75;
  return (
    <div className="flex flex-col items-center gap-1 select-none" style={{ transform: `scale(${scale})`, transformOrigin: "center top" }}>
      <div className="flex items-baseline leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <span
          className="font-black text-[5rem] tracking-tight"
          style={{
            background: "linear-gradient(160deg, #5fffaa 0%, #00ff7f 40%, #00c96e 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 18px #00ff7f88)",
          }}
        >
          V
        </span>
        <span className="font-bold text-[5rem] tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>
          oid
        </span>
      </div>
      <div className="flex items-center gap-2 mt-[-6px]">
        <div className="h-px w-6 bg-[#00ff7f]" style={{ boxShadow: "0 0 6px #00ff7f" }} />
        <span
          className="font-orbitron text-[0.6rem] tracking-[0.45em] text-[#aaa] uppercase"
        >
          Prediction Markets
        </span>
      </div>
    </div>
  );
}

const SITE_LINK = "https://voidpredictionmarkets.com/";

/* ── Pill sticker flow ──────────────────────────────────────────
   The two stickers share this page. Their QR codes differ only by
   ?pill=red or ?pill=blue. "Own the Odds" then behaves like this:
     red / no pill → straight to the app (as before)
     blue          → full-screen video, then a button to the app   */
type Pill = "red" | "blue";

const BLUE_HASH = "#blue-pill";

/** Which sticker was scanned? Read ?pill= once and remember it for the visit. */
function readPill(): Pill | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("pill");
    if (fromUrl === "red" || fromUrl === "blue") {
      sessionStorage.setItem("void-pill", fromUrl);
      return fromUrl;
    }
    const saved = sessionStorage.getItem("void-pill");
    return saved === "red" || saved === "blue" ? saved : null;
  } catch {
    return null;
  }
}

/** App link. Sticker visitors get source tags so the app's analytics can tell the pills apart. */
function appLink(pill: Pill | null): string {
  if (!pill) return SITE_LINK;
  const params = new URLSearchParams({
    utm_source: "sticker",
    utm_medium: "qr",
    utm_campaign: "pill",
    utm_content: pill,
  });
  return `${SITE_LINK}?${params.toString()}`;
}

function BluePillVideo({ onClose, link }: { onClose: () => void; link: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  const play = () => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => setNeedsTap(true)); // browser blocked sound-on autoplay → ask for a tap
  };

  const replay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    setEnded(false);
    play();
  };

  useEffect(() => {
    play();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Blue pill"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
      style={{ background: "#020202" }}
    >
      <GridBackground />
      <ParticleField />

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center gap-5 px-5 py-14 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 px-3 py-2 font-orbitron text-[10px] tracking-[0.3em] uppercase text-[#38b6ffaa] hover:text-[#38b6ff] transition-colors"
        >
          ← Back
        </button>

        <div
          className="inline-block px-4 py-1 rounded-full border font-orbitron text-[10px] tracking-[0.4em] uppercase"
          style={{ color: "#38b6ff", borderColor: "#38b6ff44", background: "rgba(56,182,255,0.06)" }}
        >
          Blue pill · Stay in the dream
        </div>

        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            aspectRatio: "16 / 9",
            width: "min(92vw, 560px)",
            border: "2px solid #38b6ff88",
            boxShadow: "0 0 40px #38b6ff44, 0 0 90px #38b6ff22",
            background: "#f8f8fb",
          }}
        >
          <video
            ref={videoRef}
            poster="/blue-pill-poster.jpg"
            playsInline
            preload="auto"
            onPlay={() => setNeedsTap(false)}
            onEnded={() => setEnded(true)}
            className="h-full w-full object-cover"
          >
            <source src="/blue-pill.mp4" type="video/mp4" />
            <source
              src="/blue-pill.webm"
              type="video/webm"
              onError={() => setEnded(true)} /* last source failed → nothing playable, skip to the button */
            />
          </video>
          {needsTap && !ended && (
            <button
              type="button"
              onClick={play}
              className="absolute inset-0 flex items-center justify-center font-orbitron font-bold text-sm tracking-[0.3em] uppercase text-white"
              style={{ background: "rgba(2,2,2,0.55)" }}
            >
              ▶ Tap to play
            </button>
          )}
        </div>

        <div className="min-h-[190px] flex flex-col items-center justify-start gap-3">
          {ended ? (
            <div className="animate-slide-up flex flex-col items-center gap-3">
              <p className="font-orbitron font-bold text-base sm:text-lg text-white tracking-wide">
                You took the blue pill.
              </p>
              <p className="font-outfit text-[#888] text-sm max-w-xs">
                Nothing happened. Except now you&apos;re curious.
              </p>
              <a
                href={link}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-orbitron font-bold text-sm tracking-widest uppercase text-[#020202] transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #00ff7f 0%, #00c96e 100%)",
                  boxShadow: "0 0 30px #00ff7f44, 0 4px 20px #00ff7f33",
                }}
              >
                Take the red pill →
              </a>
              <button
                type="button"
                onClick={replay}
                className="font-outfit text-xs text-[#666] hover:text-[#aaa] transition-colors"
              >
                ↺ Watch again
              </button>
            </div>
          ) : (
            <p className="font-outfit text-xs text-[#555] tracking-wide">
              Sit through the presentation…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ParticleField() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 8 + 6,
    opacity: Math.random() * 0.6 + 0.1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#00ff7f]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite`,
            boxShadow: `0 0 ${p.size * 3}px #00ff7f88`,
          }}
        />
      ))}
    </div>
  );
}

function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-[#020202]" />
      <div className="absolute inset-0 bg-grid" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #00ff7f0d 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 100%, #00ff7f08 0%, transparent 60%)",
        }}
      />
    </div>
  );
}

function GlitchText({ children, className }: { children: string; className?: string }) {
  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      <span className="relative z-10">{children}</span>
      <span
        className="absolute inset-0 text-[#00ff7f]"
        style={{
          animation: "glitch-1 6s steps(1) infinite",
          clipPath: "inset(0 0 100% 0)",
        }}
        aria-hidden
      >
        {children}
      </span>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div
      className="relative px-6 py-4 rounded-xl border border-[#00ff7f22] text-center"
      style={{ background: "rgba(0,255,127,0.04)" }}
    >
      <div className="font-orbitron text-2xl font-bold glow-green">{number}</div>
      <div className="font-outfit text-xs text-[#888] uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

const STEP_ICONS: Record<string, JSX.Element> = {
  pick: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff7f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="#00ff7f" stroke="none" />
      <line x1="12" y1="2" x2="12" y2="5" strokeWidth="2" />
      <line x1="12" y1="19" x2="12" y2="22" strokeWidth="2" />
      <line x1="2" y1="12" x2="5" y2="12" strokeWidth="2" />
      <line x1="19" y1="12" x2="22" y2="12" strokeWidth="2" />
    </svg>
  ),
  lock: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff7f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1.2" fill="#00ff7f" stroke="none" />
    </svg>
  ),
  trophy: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff7f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
      <path d="M12 16v4" />
      <path d="M8 20h8" />
      <path d="M9 3v5" strokeWidth="1" stroke="#00ff7f55" />
      <path d="M15 3v5" strokeWidth="1" stroke="#00ff7f55" />
    </svg>
  ),
};

function StepCard({
  step,
  iconKey,
  title,
  desc,
  delay,
}: {
  step: string;
  iconKey: string;
  title: string;
  desc: string;
  delay: string;
}) {
  return (
    <div
      className="relative rounded-2xl p-6 border border-[#00ff7f15] flex flex-col gap-3 group hover:border-[#00ff7f44] transition-all duration-500"
      style={{
        background: "linear-gradient(135deg, rgba(0,255,127,0.04) 0%, rgba(0,0,0,0.6) 100%)",
        animationDelay: delay,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
        style={{
          background: "linear-gradient(90deg, transparent, #00ff7f44, transparent)",
        }}
      />
      <div className="flex items-center gap-3">
        <span className="font-orbitron text-xs text-[#00ff7f88] tracking-widest">
          {step}
        </span>
        <div
          className="p-2 rounded-lg"
          style={{
            background: "rgba(0,255,127,0.08)",
            boxShadow: "0 0 12px #00ff7f22",
          }}
        >
          {STEP_ICONS[iconKey]}
        </div>
      </div>
      <h3 className="font-orbitron text-white font-bold text-lg tracking-wide">
        {title}
      </h3>
      <p className="font-outfit text-[#888] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function ArtisticQR({ pill, onBlue }: { pill: Pill | null; onBlue: () => void }) {
  return (
    <div className="relative flex flex-col items-center gap-6">
      <div className="relative">
        <div
          className="absolute -inset-4 rounded-2xl animate-pulse-glow"
          style={{ background: "rgba(0,255,127,0.03)" }}
        />
        <div
          className="relative rounded-2xl p-5 border border-[#00ff7f55] overflow-hidden"
          style={{ background: "#050505" }}
        >
          <div className="qr-scanner-line" />

          <div
            className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#00ff7f] animate-[corner-pulse_1.5s_ease-in-out_infinite]"
            style={{ borderRadius: "4px 0 0 0" }}
          />
          <div
            className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#00ff7f] animate-[corner-pulse_1.5s_ease-in-out_infinite_0.375s]"
            style={{ borderRadius: "0 4px 0 0" }}
          />
          <div
            className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#00ff7f] animate-[corner-pulse_1.5s_ease-in-out_infinite_0.75s]"
            style={{ borderRadius: "0 0 0 4px" }}
          />
          <div
            className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#00ff7f] animate-[corner-pulse_1.5s_ease-in-out_infinite_1.125s]"
            style={{ borderRadius: "0 0 4px 0" }}
          />

          <QRCodeSVG
            value={SITE_LINK}
            size={200}
            bgColor="#050505"
            fgColor="#00ff7f"
            level="H"
          />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="font-orbitron text-xs tracking-[0.3em] text-[#00ff7f] uppercase">
          Scan to Predict
        </p>
        <p className="font-outfit text-[#555] text-xs">
          Point your camera · enter the void
        </p>
      </div>

      <a
        href={appLink(pill)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (pill === "blue") {
            e.preventDefault();
            onBlue();
          }
        }}
        className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-orbitron font-bold text-sm tracking-widest uppercase text-[#020202] transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #00ff7f 0%, #00c96e 100%)",
          boxShadow: "0 0 30px #00ff7f44, 0 4px 20px #00ff7f33",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
        Own the Odds
      </a>
    </div>
  );
}

export default function App() {
  const [pill] = useState<Pill | null>(() => readPill());
  const [showVideo, setShowVideo] = useState(() => window.location.hash === BLUE_HASH);

  // Keep the video view in step with the browser's back button.
  useEffect(() => {
    const sync = () => setShowVideo(window.location.hash === BLUE_HASH);
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const openVideo = useCallback(() => {
    window.history.pushState({ pillVideo: true }, "", BLUE_HASH);
    setShowVideo(true);
  }, []);

  const closeVideo = useCallback(() => {
    if (window.history.state?.pillVideo) {
      window.history.back(); // popstate hides the video
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setShowVideo(false);
    }
  }, []);

  return (
    <div
      className="relative min-h-full font-outfit text-white overflow-x-hidden"
      style={{ background: "#020202" }}
    >
      <GridBackground />
      <ParticleField />

      <div className="relative z-10">
        {/* ── HERO ─────────────────────────────────────── */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="animate-float">
            <VoidLogo size="lg" />
          </div>

          <div className="mt-4 mb-8 space-y-3">
            <div
              className="inline-block px-4 py-1 rounded-full border border-[#00ff7f33] font-orbitron text-[10px] tracking-[0.4em] text-[#00ff7f88] uppercase"
              style={{ background: "rgba(0,255,127,0.05)" }}
            >
              Campus Edition · 2026
            </div>
          </div>

          <h1
            className="font-orbitron font-black text-[clamp(2rem,8vw,5rem)] leading-tight tracking-tight max-w-4xl animate-text-glow"
            style={{ color: "#ffffff" }}
          >
            SEE THE{" "}
            <span className="glow-green">FUTURE</span>
            <br />
            BEFORE IT HAPPENS
          </h1>

          <p className="mt-6 font-outfit text-[#888] text-lg sm:text-xl max-w-md leading-relaxed">
            The first prediction market built <em className="text-[#bbb] not-italic">exclusively</em> for
            campus students.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <StatCard number="2026" label="Guild Elections" />
            <StatCard number="0 UGX" label="No Real Money" />
            <StatCard number="∞" label="Points to Earn" />
          </div>

          <div className="mt-14">
            <div
              className="w-px h-16 mx-auto"
              style={{
                background:
                  "linear-gradient(to bottom, #00ff7f66, transparent)",
              }}
            />
            <p className="font-orbitron text-[10px] tracking-[0.4em] text-[#00ff7f44] uppercase mt-3">
              Scroll
            </p>
          </div>
        </section>

        {/* ── ABOUT ────────────────────────────────────── */}
        <section className="px-6 py-24 max-w-3xl mx-auto text-center">
          <div
            className="inline-block mb-6 px-3 py-1 rounded border border-[#00ff7f22] font-orbitron text-[9px] tracking-[0.5em] text-[#00ff7f66] uppercase"
          >
            What is Void
          </div>

          <h2 className="font-orbitron font-bold text-[clamp(1.5rem,5vw,2.8rem)] text-white leading-tight mb-8">
            Guild Elections 2026.<br />
            <GlitchText className="glow-green">Who do YOU think wins?</GlitchText>
          </h2>

          <div
            className="relative rounded-2xl p-8 sm:p-10 border border-[#00ff7f15] text-left space-y-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,255,127,0.05) 0%, rgba(0,0,0,0.7) 100%)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #00ff7f66, transparent)",
              }}
            />
            <p className="font-outfit text-[#ccc] text-lg leading-relaxed">
              Everyone on campus has an opinion about who's taking the guild.{" "}
              <span className="text-white font-semibold">Void makes you prove it.</span>
            </p>
            <p className="font-outfit text-[#aaa] text-base leading-relaxed">
              Pick which candidate wins each position. Lock in your prediction
              before the results drop. Earn points when you're right — and watch
              your read stack up against the entire campus.
            </p>
            <p className="font-outfit text-[#888] text-base leading-relaxed">
              No real money. No stress. Just your instincts vs. everyone else's.
              The crowd always has a call —{" "}
              <span className="text-[#00ff7f] font-medium">
                the question is whether yours is sharper.
              </span>
            </p>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────── */}
        <section className="px-6 py-16 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-block mb-4 px-3 py-1 rounded border border-[#00ff7f22] font-orbitron text-[9px] tracking-[0.5em] text-[#00ff7f66] uppercase"
            >
              How it Works
            </div>
            <h2 className="font-orbitron font-bold text-2xl sm:text-3xl text-white">
              Three moves. That's it.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StepCard
              step="01"
              iconKey="pick"
              title="PICK"
              desc="Browse the 2026 Guild Election candidates. Choose who you think takes each position."
              delay="0ms"
            />
            <StepCard
              step="02"
              iconKey="lock"
              title="PREDICT"
              desc="Lock in your call before the results drop. Once it's in, it's in — no flipping."
              delay="100ms"
            />
            <StepCard
              step="03"
              iconKey="trophy"
              title="STACK POINTS"
              desc="Correct predictions earn points. Climb the campus leaderboard. Prove your read is right."
              delay="200ms"
            />
          </div>
        </section>

        {/* ── QR JOIN SECTION ───────────────────────────── */}
        <section className="px-6 py-24 max-w-lg mx-auto text-center">
          <div
            className="inline-block mb-6 px-3 py-1 rounded border border-[#00ff7f22] font-orbitron text-[9px] tracking-[0.5em] text-[#00ff7f66] uppercase"
          >
            Start Predicting
          </div>
          <h2 className="font-orbitron font-bold text-2xl sm:text-3xl text-white mb-3">
            Your read.{" "}
            <span className="glow-green">Your call.</span>
          </h2>

          <p
            className="font-outfit text-lg font-semibold mb-2"
            style={{ color: "#00ff7f", textShadow: "0 0 20px #00ff7f66" }}
          >
            The campus already has a prediction. Does yours beat it?
          </p>

          <p className="font-outfit text-[#666] text-sm mb-10">
            Scan the code or tap below — make your picks on the 2026 Guild Elections before everyone else does.
          </p>

          <ArtisticQR pill={pill} onBlue={openVideo} />
        </section>

        {/* ── FOOTER ───────────────────────────────────── */}
        <footer className="px-6 py-10 text-center border-t border-[#00ff7f0f]">
          <div className="mb-3 opacity-50">
            <VoidLogo size="sm" />
          </div>
          <p className="font-orbitron text-[10px] tracking-[0.3em] text-[#555] uppercase">
            © 2026 Void Prediction Markets · Campus Edition
          </p>
          <p className="font-outfit text-xs text-[#444] mt-1">
            Free to play — no real money, just bragging rights
          </p>
          <p className="font-outfit text-xs text-[#444] mt-0.5">
            100% free · powered by points, not cash
          </p>
        </footer>
      </div>

      {showVideo && <BluePillVideo onClose={closeVideo} link={appLink(pill ?? "blue")} />}
    </div>
  );
}
