import {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import NextHead from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "motion/react";
import { animate, inView } from "motion";
import { searchParties, getParty } from "@/utils/firebase";
import type { Party } from "@/types/rsvp";

const G = "#58674a";
const TEAL = "#46606a";

// useLayoutEffect on the client, useEffect on the server (avoids SSR warning)
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const EASE_OUT = [0.2, 0.7, 0.2, 1] as const;
const EASE_INTRO = [0.62, 0.04, 0.2, 1] as const;

export default function Home() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Party[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [preloadedParty, setPreloadedParty] = useState<Party | null>(null);

  // ---- Intro animation (couple illustration) ----
  const illoRef = useRef<HTMLImageElement>(null);
  const [illoSrc, setIlloSrc] = useState("/couple-first.png");
  const [introStage, setIntroStage] = useState<"paused" | "playing" | "done">(
    "paused",
  );
  const [splashTextTop, setSplashTextTop] = useState<number | null>(null);
  const [illoReady, setIlloReady] = useState(false);
  const introRanRef = useRef(false);

  // Place a small, centred splash version of the illustration that will
  // GROW into its (larger) resting slot above the names when clicked.
  // Measured against the untransformed "home" box, then positioned with
  // Framer Motion's animate (x/y/scale composited on the GPU).
  const recalcIntro = useCallback(() => {
    const el = illoRef.current;
    if (!el) return;
    // Clear any transform so we measure the true resting box
    animate(el, { x: 0, y: 0, scale: 1 }, { duration: 0 });
    const r = el.getBoundingClientRect();
    if (!r.height) {
      requestAnimationFrame(recalcIntro);
      return;
    }
    const targetH = Math.min(window.innerHeight * 0.32, 250); // small start
    const s = targetH / r.height; // < 1 → starts smaller, grows to home
    const vpCY = window.innerHeight * 0.42;
    const dx = window.innerWidth / 2 - (r.left + r.width / 2);
    const dy = vpCY - (r.top + r.height / 2);
    animate(el, { x: dx, y: dy, scale: s }, { duration: 0 });
    setSplashTextTop(vpCY + targetH / 2 + 26);
    setIlloReady(true);
  }, []);

  // Deep links (e.g. /#rsvp) skip the intro splash entirely so the browser
  // can scroll straight to the section.
  useIsoLayoutEffect(() => {
    const hash = window.location.hash;
    if (hash && hash !== "#" && hash !== "#top") {
      setIntroStage("done");
      setIlloSrc("/couple-last.png");
      requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (introStage !== "paused") return;
    requestAnimationFrame(recalcIntro);
    const onResize = () => recalcIntro();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [introStage, recalcIntro]);

  // Lock the page while the intro splash is on screen
  useEffect(() => {
    if (introStage === "paused" || introStage === "playing") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (introRanRef.current) {
        window.scrollTo(0, 0);
        introRanRef.current = false;
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [introStage]);

  const handleViewInvite = useCallback(() => {
    if (introStage !== "paused") return;
    const el = illoRef.current;
    introRanRef.current = true;
    setIlloSrc("/couple-anim.gif");
    if (el) {
      // Grow into the resting slot
      animate(
        el,
        { x: 0, y: 0, scale: 1 },
        { duration: 2.2, ease: EASE_INTRO },
      );
    }
    setIntroStage("playing");
    window.setTimeout(() => {
      setIlloSrc("/couple-last.png");
      setIntroStage("done");
    }, 2950);
  }, [introStage]);

  const introActive = introStage !== "done";

  // Animations — powered by Framer Motion (GPU-composited, WAAPI-backed)
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // Ambient float / sway / breathe / wave loops
    const floatKeyframes: Record<string, Record<string, number[]>> = {
      floatY: { y: [0, -13, 0] },
      sway: { rotate: [-2.6, 2.6, -2.6] },
      breathe: { opacity: [0.5, 1, 0.5] },
      wave: { x: [0, -18, 0] },
    };
    const floatDuration: Record<string, number> = {
      floatY: 6.5,
      sway: 7,
      breathe: 4,
      wave: 9,
    };
    document.querySelectorAll<HTMLElement>("[data-float]").forEach((el) => {
      // Ambient loops run for the page's lifetime. We intentionally do NOT
      // stop them on cleanup — under React StrictMode the effect double-runs,
      // and stopping froze the WAAPI loop mid-flight. Guard so each element is
      // only ever animated once.
      if (el.dataset.floatInit) return;
      el.dataset.floatInit = "1";
      const t = el.getAttribute("data-float") || "floatY";
      const delay = parseFloat(el.getAttribute("data-delay") || "0");
      if (t === "sway") el.style.transformOrigin = "50% 100%";
      animate(el, floatKeyframes[t] || floatKeyframes.floatY, {
        duration: floatDuration[t] || 6.5,
        delay,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      });
    });

    // SVG draw-on-scroll. IntersectionObserver is unreliable on inline SVG
    // child elements (paths/circles have no reliable box), so we observe the
    // parent <svg> (a real box) and draw all its data-draw children when it
    // enters view.
    const drawSvgs = new Set<SVGSVGElement>();
    document
      .querySelectorAll<SVGGeometryElement>("[data-draw]")
      .forEach((p) => {
        let L = 300;
        try {
          if ("getTotalLength" in p) L = p.getTotalLength();
        } catch {}
        p.style.strokeDasharray = String(L);
        p.style.strokeDashoffset = String(L);
        p.dataset.len = String(L);
        const svg = p.closest("svg");
        if (svg) drawSvgs.add(svg);
      });
    drawSvgs.forEach((svg) => {
      // Optional per-svg trigger margin (rootMargin). e.g. the hero wave holds
      // until it is 30% up from the bottom of the viewport.
      const drawMargin = svg.getAttribute("data-draw-margin") || undefined;
      let stop: (() => void) | undefined;
      // eslint-disable-next-line prefer-const
      stop = inView(
        svg,
        () => {
          svg
            .querySelectorAll<SVGGeometryElement>("[data-draw]")
            .forEach((p) => {
              const L = parseFloat(p.dataset.len || "300");
              const delay = parseFloat(p.getAttribute("data-delay") || "0");
              // Motion's animate() no-ops on strokeDashoffset for SVG geometry,
              // so drive the stroke draw with the native WAAPI (smooth + GPU).
              p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], {
                duration: 2000,
                delay: delay * 1000,
                easing: "cubic-bezier(.45,0,.2,1)",
                fill: "forwards",
              });
            });
          stop?.();
        },
        drawMargin
          ? { amount: "some", margin: drawMargin as `${number}px` }
          : { amount: 0.15 },
      );
      cleanups.push(() => stop?.());
    });

    // Scroll reveal (fade + rise once in view)
    document.querySelectorAll<HTMLElement>(".js-reveal").forEach((el) => {
      el.style.opacity = "0";
      let stop: (() => void) | undefined;
      // eslint-disable-next-line prefer-const
      stop = inView(
        el,
        () => {
          animate(
            el,
            { opacity: [0, 1], y: [24, 0] },
            { duration: 1.0, ease: EASE_OUT },
          );
          stop?.();
        },
        { amount: 0.1 },
      );
      cleanups.push(() => stop?.());
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  // Handle ?partyId= invite links from the admin dashboard
  useEffect(() => {
    if (!router.isReady) return;
    const { partyId } = router.query;
    if (!partyId || typeof partyId !== "string") return;

    getParty(partyId).then((party) => {
      if (!party) return;
      if (party.confirmationCode) {
        router.replace(`/rsvp/${party.confirmationCode}`);
        return;
      }
      setPreloadedParty(party);
    });
  }, [router.isReady, router.query]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchTerm.trim()) return;
      setIsSearching(true);
      setSearchError("");
      try {
        const results = await searchParties(searchTerm);
        setSearchResults(results);
        setHasSearched(true);
        if (results.length === 0)
          setSearchError(
            "No invitations found. Please check your spelling or try a different name.",
          );
      } catch (err) {
        console.error(err);
        setSearchError("Something went wrong. Please try again.");
      } finally {
        setIsSearching(false);
      }
    },
    [searchTerm],
  );

  const handlePartySelect = (party: Party) => {
    if (party.confirmationCode) {
      router.push(`/rsvp/${party.confirmationCode}`);
    } else {
      router.push(`/form?partyId=${party.id}`);
    }
  };

  return (
    <>
      <NextHead>
        <title>Youssef &amp; Sandra — Wedding · September 19, 2026</title>
        <meta
          name="description"
          content="Join us for a celebration by the sea at Dayra Camp — September 19, 2026."
        />
        <meta
          property="og:title"
          content="Youssef & Sandra — Wedding · September 19, 2026"
        />
        <meta
          property="og:description"
          content="Join us for a celebration by the sea at Dayra Camp."
        />
        <meta property="og:image" content="/og-image (4).png" />
        <link rel="preload" as="image" href="/couple-anim.gif" />
        <link rel="icon" href="/favicon.ico" />
      </NextHead>

      <div
        id="top"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f5f1e6",
          color: "#474b40",
          fontFamily: "'Mulish', sans-serif",
        }}
      >
        {/* ==================== INTRO SPLASH ==================== */}
        <AnimatePresence>
          {introActive && (
            <>
              {/* Cream backdrop that fades away as the couple grows in */}
              <motion.div
                key="intro-backdrop"
                aria-hidden="true"
                initial={{ opacity: 1 }}
                animate={{ opacity: introStage === "paused" ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.3, ease: "easeInOut" }}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "#f5f1e6",
                  zIndex: 100,
                  pointerEvents: introStage === "paused" ? "auto" : "none",
                }}
              />
              {/* Splash text + button */}
              <motion.div
                key="intro-splash"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: introStage === "paused" && illoReady ? 1 : 0,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
                style={{
                  position: "fixed",
                  left: 0,
                  right: 0,
                  top: splashTextTop ?? undefined,
                  bottom: splashTextTop == null ? "12vh" : undefined,
                  zIndex: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 18,
                  padding: "0 24px",
                  textAlign: "center",
                  pointerEvents: introStage === "paused" ? "auto" : "none",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      letterSpacing: "0.34em",
                      textTransform: "uppercase",
                      color: "#8a9079",
                      margin: "0 0 2px",
                    }}
                  >
                    The wedding of
                  </p>
                  <p
                    style={{
                      fontFamily: "'Tangerine', cursive",
                      fontWeight: 400,
                      color: G,
                      fontSize: "clamp(2.6rem, 9vw, 3.8rem)",
                      lineHeight: 1,
                      margin: 0,
                    }}
                  >
                    Youssef &amp; Sandra
                  </p>
                </div>
                <motion.button
                  onClick={handleViewInvite}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 12,
                    background: G,
                    color: "#f5f1e6",
                    border: "none",
                    padding: "16px 40px",
                    borderRadius: 999,
                    fontSize: "0.78rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 16px 34px -18px rgba(88,103,74,0.8)",
                  }}
                >
                  View invitation
                  <span style={{ fontSize: "1rem", lineHeight: 0 }}>→</span>
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ==================== HEADER ==================== */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(245,241,230,0.88)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(88,103,74,0.14)",
          }}
        >
          <div
            className="site-header-inner"
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px 24px",
            }}
          >
            <a
              href="#top"
              style={{
                fontFamily: "'Tangerine', cursive",
                fontSize: "1.9rem",
                color: G,
                textDecoration: "none",
                lineHeight: 1,
              }}
            >
              Y &amp; S
            </a>
            <nav
              className="site-nav"
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "6px 26px",
                fontSize: "0.74rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              <span className="site-nav-links" style={{ display: "contents" }}>
                <a
                  href="#ceremony"
                  style={{ color: "#6c7261", textDecoration: "none" }}
                >
                  Ceremony
                </a>
                <a
                  href="#reception"
                  style={{ color: "#6c7261", textDecoration: "none" }}
                >
                  Reception
                </a>
                <a
                  href="#gifts"
                  style={{ color: "#6c7261", textDecoration: "none" }}
                >
                  Gifts
                </a>
              </span>
              <a
                href="#rsvp"
                style={{
                  color: "#f5f1e6",
                  background: G,
                  textDecoration: "none",
                  padding: "10px 20px",
                  borderRadius: 999,
                }}
              >
                RSVP
              </a>
            </nav>
          </div>
        </header>

        {/* ==================== HERO ==================== */}
        <section
          className="hero-section"
          style={{
            position: "relative",
            minHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "80px 24px 0",
            scrollMarginTop: "var(--scroll-offset)",
          }}
        >
          <div
            style={{ position: "relative", zIndex: 2, maxWidth: 760 }}
            className="js-reveal"
          >
            <p
              style={{
                fontSize: "0.78rem",
                letterSpacing: "0.34em",
                textTransform: "uppercase",
                color: "#8a9079",
                margin: "0 0 4px",
              }}
            >
              Together with their families
            </p>
          </div>

          {/* Couple illustration — flies in from the intro splash.
              unoptimized so the animation GIF plays and src swaps cleanly. */}
          <Image
            ref={illoRef}
            src={illoSrc}
            alt="Youssef and Sandra"
            width={530}
            height={600}
            unoptimized
            priority
            draggable={false}
            onLoad={() => {
              if (introStage === "paused") recalcIntro();
            }}
            style={{
              width: "min(340px, 74vw)",
              height: "auto",
              display: "block",
              margin: "10px auto 0",
              position: introActive ? "relative" : "static",
              zIndex: introActive ? 110 : "auto",
              transformOrigin: "center center",
              opacity: introStage === "paused" && !illoReady ? 0 : 1,
              willChange: "transform",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />

          {/* Names + details */}
          <div
            style={{ position: "relative", zIndex: 2, maxWidth: 760 }}
            className="js-reveal"
          >
            <h1
              style={{
                fontFamily: "'Tangerine', cursive",
                fontWeight: 400,
                color: G,
                fontSize: "clamp(4.2rem, 15vw, 9rem)",
                lineHeight: 0.92,
                margin: 0,
              }}
            >
              Youssef{" "}
              <span style={{ fontSize: "0.62em", color: "#a9b196" }}>
                &amp;
              </span>{" "}
              Sandra
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                margin: "22px 0 6px",
                color: "#6c7261",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(1.1rem, 2.6vw, 1.5rem)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  height: 1,
                  width: 44,
                  background: "#bcc3aa",
                  display: "block",
                }}
              />
              Saturday · September 19, 2026
              <span
                style={{
                  height: 1,
                  width: 44,
                  background: "#bcc3aa",
                  display: "block",
                }}
              />
            </div>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
                color: "#7d8270",
                margin: "6px 0 28px",
              }}
            >
              A celebration by the sea · Dayra Camp
            </p>
            <a
              href="#rsvp"
              style={{
                display: "inline-block",
                background: G,
                color: "#f5f1e6",
                textDecoration: "none",
                padding: "17px 46px",
                borderRadius: 999,
                fontSize: "0.8rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              RSVP by August 15th
            </a>
          </div>

          <svg
            viewBox="0 0 1200 130"
            preserveAspectRatio="none"
            data-float="wave"
            data-draw-margin="0px 0px -30% 0px"
            style={{
              position: "absolute",
              left: "-3%",
              bottom: 0,
              width: "106%",
              height: 130,
              zIndex: 1,
            }}
            fill="none"
            stroke="#84a9b2"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path
              data-draw=""
              d="M0,74 C150,44 300,104 450,74 C600,44 750,104 900,74 C1050,44 1150,94 1200,74"
            />
            <path
              data-draw=""
              data-delay="0.2"
              style={{ opacity: 0.7 }}
              d="M0,96 C160,70 320,120 480,96 C640,72 800,118 960,96 C1080,78 1150,108 1200,96"
            />
            <path
              data-draw=""
              data-delay="0.4"
              style={{ opacity: 0.45 }}
              d="M0,116 C180,96 360,134 540,116 C720,98 900,134 1080,116 C1140,110 1170,120 1200,116"
            />
          </svg>
        </section>

        {/* ==================== PHOTO BAND ==================== */}
        <section
          style={{
            background: "#f5f1e6",
            padding: "6px 0 clamp(48px, 8vw, 88px)",
          }}
        >
          <div
            style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}
            className="js-reveal"
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "clamp(400px, 40vw, 560px)",
                borderRadius: 22,
                overflow: "hidden",
              }}
            >
              <Image
                src="/couple-photo.png"
                alt="Youssef and Sandra"
                fill
                sizes="(max-width: 1180px) 100vw, 1180px"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        </section>

        {/* ==================== CEREMONY ==================== */}
        <section
          id="ceremony"
          style={{
            background: "#faf8f1",
            scrollMarginTop: "var(--scroll-offset)",
          }}
        >
          <div
            style={{
              maxWidth: 1000,
              margin: "0 auto",
              padding: "clamp(72px, 11vw, 128px) 24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 56,
              alignItems: "center",
            }}
            className="js-reveal"
          >
            <div>
              <p
                style={{
                  fontSize: "0.76rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#8a9079",
                  margin: "0 0 10px",
                }}
              >
                The Ceremony
              </p>
              <h2
                style={{
                  fontFamily: "'Tangerine', cursive",
                  fontWeight: 400,
                  color: G,
                  fontSize: "clamp(2.8rem, 7vw, 4.4rem)",
                  lineHeight: 1.32,
                  paddingBottom: "1.05em",
                  margin: "0 0 16px",
                }}
              >
                Where it begins
              </h2>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.35rem",
                  color: "#5b6051",
                  lineHeight: 1.5,
                  margin: "0 0 26px",
                  maxWidth: "38ch",
                }}
              >
                We will exchange our vows at{" "}
                <strong style={{ fontWeight: 600, color: G }}>
                  Saint Mary &amp; Saint Athanasius Church
                </strong>{" "}
                before making our way to the shore.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "14px 40px",
                  marginBottom: 28,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.72rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#9a9a8a",
                    }}
                  >
                    Time
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "1.5rem",
                      color: G,
                    }}
                  >
                    12:30 in the afternoon
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.72rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#9a9a8a",
                    }}
                  >
                    Dress code
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "1.5rem",
                      color: G,
                    }}
                  >
                    Formal
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 22,
              }}
            >
              <svg
                viewBox="0 0 220 210"
                style={{ width: "min(230px, 60vw)", height: "auto" }}
                fill="none"
                stroke="#84a9b2"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path data-draw="" d="M100,12 L100,42 M86,26 L114,26" />
                <path
                  data-draw=""
                  data-delay="0.2"
                  d="M44,188 L44,96 C44,46 100,42 100,42 C100,42 156,46 156,96 L156,188"
                />
                <path
                  data-draw=""
                  data-delay="0.5"
                  d="M84,188 L84,118 C84,92 116,92 116,118 L116,188"
                />
                <path
                  data-draw=""
                  data-delay="0.6"
                  d="M100,118 L100,158 M88,138 L112,138"
                />
                <path data-draw="" data-delay="0.7" d="M26,188 L194,188" />
              </svg>
              <a
                href="https://maps.google.com/?q=Saint+Mary+and+Saint+Athanasius+Church"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                  color: G,
                  border: `1px solid ${G}`,
                  borderRadius: 999,
                  padding: "12px 26px",
                  fontSize: "0.76rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                View ceremony map
              </a>
            </div>
          </div>
        </section>

        {/* ==================== DRESS CODE ==================== */}
        <section
          id="dress-code"
          style={{
            background: "#eef0e6",
            scrollMarginTop: "var(--scroll-offset)",
          }}
        >
          <div
            style={{
              maxWidth: 1000,
              margin: "0 auto",
              padding: "clamp(44px, 7vw, 72px) 24px",
              textAlign: "center",
            }}
            className="js-reveal"
          >
            <p
              style={{
                fontSize: "0.74rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#8a9079",
                margin: "0 0 6px",
              }}
            >
              The Dress Code
            </p>
            <h2
              style={{
                fontFamily: "'Tangerine', cursive",
                fontWeight: 400,
                color: G,
                fontSize: "clamp(2.4rem, 6vw, 3.6rem)",
                lineHeight: 1.2,
                paddingBottom: "0.4em",
                margin: "0 0 8px",
              }}
            >
              What to wear
            </h2>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "clamp(1.1rem, 2.6vw, 1.35rem)",
                color: "#6c7261",
                maxWidth: "42ch",
                margin: "0 auto",
              }}
            >
              Formal — dressed for an evening by the sea and sun.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 14,
                maxWidth: 720,
                margin: "26px auto 0",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  background: "#f6f7ef",
                  border: "1px solid rgba(88,103,74,0.16)",
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: "0.7rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: G,
                  }}
                >
                  Gentlemen
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    lineHeight: 1.55,
                    color: "#5b6051",
                  }}
                >
                  Suits and linen suits warmly welcomed for the sea and sun. No
                  smart casual, please.
                </p>
              </div>
              <div
                style={{
                  background: "#f6f7ef",
                  border: "1px solid rgba(88,103,74,0.16)",
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: "0.7rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: G,
                  }}
                >
                  Ladies
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    lineHeight: 1.55,
                    color: "#5b6051",
                  }}
                >
                  Elegant dresses or formal separates. Think florals, flowing
                  silhouettes, and soft colours that belong by the sea.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== RECEPTION + VENUE ==================== */}
        <section
          id="reception"
          style={{
            background: "#ece5d4",
            scrollMarginTop: "var(--scroll-offset)",
          }}
        >
          {/* Reception */}
          <div
            style={{
              maxWidth: 1000,
              margin: "0 auto",
              padding: "clamp(56px, 9vw, 96px) 24px clamp(36px, 6vw, 56px)",
              textAlign: "center",
            }}
            className="js-reveal"
          >
            <p
              style={{
                fontSize: "0.76rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#8a8062",
                margin: "0 0 10px",
              }}
            >
              The Reception
            </p>
            <h2
              style={{
                fontFamily: "'Tangerine', cursive",
                fontWeight: 400,
                color: G,
                fontSize: "clamp(2.8rem, 7vw, 4.4rem)",
                lineHeight: 1.32,
                paddingBottom: "0.66em",
                margin: "0 0 16px",
              }}
            >
              An afternoon by the water
            </h2>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "clamp(1.25rem, 3vw, 1.6rem)",
                color: "#7d7457",
                maxWidth: "46ch",
                margin: "0 auto 8px",
              }}
            >
              Long tables overlooking the sea, with the water in front of us and
              the evening unfolding slowly into the night.
            </p>

            <svg
              viewBox="0 0 420 130"
              data-float="breathe"
              style={{
                width: "min(420px, 86vw)",
                height: "auto",
                margin: "18px auto 6px",
              }}
              fill="none"
              stroke="#7e8c6a"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                data-draw=""
                d="M6,18 C90,86 150,86 210,30 C270,86 330,86 414,18"
              />
              <g strokeWidth="1.4">
                <path data-draw="" data-delay="0.3" d="M62,57 L62,67" />
                <circle data-draw="" data-delay="0.35" cx="62" cy="76" r="9" />
                <path data-draw="" data-delay="0.35" d="M120,72 L120,82" />
                <circle data-draw="" data-delay="0.4" cx="120" cy="91" r="9" />
                <path data-draw="" data-delay="0.4" d="M180,60 L180,70" />
                <circle data-draw="" data-delay="0.45" cx="180" cy="79" r="9" />
                <path data-draw="" data-delay="0.45" d="M240,60 L240,70" />
                <circle data-draw="" data-delay="0.5" cx="240" cy="79" r="9" />
                <path data-draw="" data-delay="0.5" d="M300,72 L300,82" />
                <circle data-draw="" data-delay="0.55" cx="300" cy="91" r="9" />
                <path data-draw="" data-delay="0.55" d="M358,57 L358,67" />
                <circle data-draw="" data-delay="0.6" cx="358" cy="76" r="9" />
              </g>
            </svg>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 2,
                maxWidth: 760,
                margin: "40px auto 0",
                textAlign: "center",
              }}
            >
              {[
                { time: "3:30", label: "Welcome drinks & appetizers" },
                { time: "5:00", label: "First dance" },
                { time: "6:00", label: "Dancing into the night" },
                { time: "11:00", label: "Say goodnight" },
              ].map(({ time, label }) => (
                <div
                  key={time}
                  style={{
                    padding: "24px 16px",
                    borderTop: "1px solid rgba(88,103,74,0.22)",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "1.7rem",
                      color: G,
                    }}
                  >
                    {time}
                  </p>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "0.78rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#8a8062",
                    }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ height: 1, background: "rgba(88,103,74,0.18)" }} />
          </div>

          {/* Venue */}
          <div
            id="venue"
            style={{
              maxWidth: 1000,
              margin: "0 auto",
              padding: "clamp(36px, 6vw, 56px) 24px clamp(56px, 9vw, 96px)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 36,
              alignItems: "center",
            }}
            className="js-reveal"
          >
            <div style={{ order: 2 }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "clamp(220px, 30vw, 320px)",
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                <Image
                  src="/dayra-1.png"
                  alt="Dayra Camp"
                  fill
                  sizes="(max-width: 900px) 100vw, 450px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
            <div style={{ order: 1 }}>
              <p
                style={{
                  fontSize: "0.76rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#7c9097",
                  margin: "0 0 14px",
                }}
              >
                The Venue
              </p>
              <h2
                style={{
                  fontFamily: "'Tangerine', cursive",
                  fontWeight: 400,
                  color: TEAL,
                  fontSize: "clamp(2.8rem, 7vw, 4.4rem)",
                  lineHeight: 1.32,
                  paddingBottom: "0.66em",
                  margin: "0 0 22px",
                }}
              >
                Dayra Camp
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  color: "#5f7177",
                  lineHeight: 1.7,
                  margin: "0 0 24px",
                  maxWidth: "42ch",
                }}
              >
                From the ceremony it is about a{" "}
                <strong style={{ color: TEAL }}>90-minute drive</strong> along
                the coast. We&apos;re arranging a bus for those who&apos;d like
                to ride together — just let us know when you RSVP.
              </p>
              <a
                href="https://maps.google.com/?q=Dayra+Camp"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                  color: TEAL,
                  border: `1px solid ${TEAL}`,
                  borderRadius: 999,
                  padding: "13px 28px",
                  fontSize: "0.74rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Open venue map
              </a>
            </div>
          </div>
        </section>

        {/* ==================== RSVP ==================== */}
        <section
          id="rsvp"
          style={{
            background: "#f5f1e6",
            scrollMarginTop: "var(--scroll-offset)",
          }}
        >
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              padding: "clamp(72px, 11vw, 128px) 24px",
              textAlign: "center",
            }}
            className="js-reveal"
          >
            <svg
              viewBox="0 0 200 134"
              data-float="floatY"
              style={{
                width: 140,
                height: "auto",
                margin: "0 auto 18px",
                display: "block",
              }}
              fill="none"
              stroke="#7e8c6a"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path data-draw="" d="M24,36 L176,36 L176,116 L24,116 Z" />
              <path data-draw="" data-delay="0.3" d="M24,40 L100,90 L176,40" />
              <path
                data-draw=""
                data-delay="0.55"
                d="M100,72 C95,62 81,64 81,74 C81,84 100,92 100,92 C100,92 119,84 119,74 C119,64 105,62 100,72 Z"
              />
            </svg>
            <p
              style={{
                fontSize: "0.76rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#8a9079",
                margin: "0 0 10px",
              }}
            >
              Will you join us?
            </p>
            <h2
              style={{
                fontFamily: "'Tangerine', cursive",
                fontWeight: 400,
                color: G,
                fontSize: "clamp(2.8rem, 7vw, 4.4rem)",
                lineHeight: 1.32,
                paddingBottom: "0.66em",
                margin: "0 0 12px",
              }}
            >
              RSVP
            </h2>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "1.4rem",
                color: "#7d8270",
                margin: "0 0 38px",
              }}
            >
              Kindly reply by the 15th of August.
            </p>

            {preloadedParty ? (
              /* Welcome card — shown when arriving via invite link */
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    background: "#eef0e6",
                    border: "1px solid rgba(88,103,74,0.18)",
                    borderRadius: 18,
                    padding: "36px 32px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: "0.72rem",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "#8a9079",
                    }}
                  >
                    A seat is saved for
                  </p>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontFamily: "'Tangerine', cursive",
                      fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
                      color: G,
                      lineHeight: 1.2,
                    }}
                  >
                    {preloadedParty.members.map((m) => m.firstName).join(" & ")}
                  </p>
                  {preloadedParty.partyLabel && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontFamily: "'Cormorant Garamond', serif",
                        fontStyle: "italic",
                        fontSize: "1.15rem",
                        color: "#7d8270",
                      }}
                    >
                      {preloadedParty.partyLabel}
                    </p>
                  )}
                  <p
                    style={{
                      margin: "20px 0 0",
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "1.2rem",
                      color: "#5b6051",
                      lineHeight: 1.6,
                    }}
                  >
                    We&apos;ve been looking forward to celebrating with you. Let
                    us know you&apos;ll be there.
                  </p>
                  <button
                    onClick={() => handlePartySelect(preloadedParty)}
                    style={{
                      marginTop: 28,
                      width: "100%",
                      background: G,
                      color: "#f5f1e6",
                      border: "none",
                      padding: 18,
                      borderRadius: 999,
                      fontSize: "0.8rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    RSVP now
                  </button>
                </div>
                <button
                  onClick={() => setPreloadedParty(null)}
                  style={{
                    marginTop: 16,
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    color: "#9a9a8a",
                    fontSize: "0.8rem",
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                    padding: "8px 0",
                  }}
                >
                  Not you? Search for your invitation instead →
                </button>
              </div>
            ) : (
              /* Search form */
              <>
                <form onSubmit={handleSearch} style={{ textAlign: "left" }}>
                  <label style={{ display: "block", marginBottom: 26 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.72rem",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "#9a9a8a",
                        marginBottom: 8,
                      }}
                    >
                      Your name
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (hasSearched) {
                          setHasSearched(false);
                          setSearchResults([]);
                          setSearchError("");
                        }
                      }}
                      placeholder="Enter your name to find your invitation"
                      style={{
                        width: "100%",
                        border: "none",
                        borderBottom: "1px solid #b9bea8",
                        background: "transparent",
                        padding: "10px 2px",
                        fontSize: "1.05rem",
                        color: "#474b40",
                        outline: "none",
                      }}
                    />
                  </label>
                  <motion.button
                    type="submit"
                    disabled={isSearching || !searchTerm.trim()}
                    whileTap={
                      isSearching || !searchTerm.trim()
                        ? undefined
                        : { scale: 0.98 }
                    }
                    animate={{
                      backgroundColor:
                        isSearching || !searchTerm.trim()
                          ? "rgba(88,103,74,0)"
                          : G,
                      color:
                        isSearching || !searchTerm.trim()
                          ? "#9a9a8a"
                          : "#f5f1e6",
                      borderColor:
                        isSearching || !searchTerm.trim() ? "#cdd1c1" : G,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    style={{
                      width: "100%",
                      borderWidth: 1,
                      borderStyle: "solid",
                      padding: 18,
                      borderRadius: 999,
                      fontSize: "0.8rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      cursor:
                        isSearching || !searchTerm.trim()
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isSearching ? "Searching…" : "Find my invitation"}
                  </motion.button>
                </form>

                {hasSearched && searchResults.length > 0 && (
                  <div style={{ marginTop: 28, textAlign: "left" }}>
                    <p
                      style={{
                        fontSize: "0.76rem",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "#8a9079",
                        margin: "0 0 14px",
                      }}
                    >
                      {searchResults.length === 1
                        ? "Found 1 invitation:"
                        : `Found ${searchResults.length} invitations:`}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {searchResults.map((party) => (
                        <button
                          key={party.id}
                          onClick={() => handlePartySelect(party)}
                          style={{
                            textAlign: "left",
                            padding: "18px 22px",
                            border: `1px solid rgba(88,103,74,0.22)`,
                            borderRadius: 14,
                            background: "#faf8f1",
                            cursor: "pointer",
                            width: "100%",
                          }}
                        >
                          {party.partyLabel && (
                            <p
                              style={{
                                margin: "0 0 4px",
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: "1.2rem",
                                color: G,
                                fontWeight: 600,
                              }}
                            >
                              {party.partyLabel}
                            </p>
                          )}
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.9rem",
                              color: "#5b6051",
                            }}
                          >
                            {party.members
                              .map((m) => `${m.firstName} ${m.lastName}`)
                              .join(", ")}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(hasSearched && searchResults.length === 0) || searchError ? (
                  <div
                    style={{
                      marginTop: 28,
                      background: "#eef0e6",
                      border: "1px solid rgba(88,103,74,0.2)",
                      borderRadius: 14,
                      padding: "18px 22px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        color: "#5b6051",
                      }}
                    >
                      {searchError ||
                        "No invitations found. Please check your spelling or try a different name."}
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>

        {/* ==================== GIFTS ==================== */}
        <section
          id="gifts"
          style={{
            background: "#faf8f1",
            scrollMarginTop: "var(--scroll-offset)",
          }}
        >
          <div
            style={{
              maxWidth: 760,
              margin: "0 auto",
              padding: "clamp(72px, 11vw, 128px) 24px",
              textAlign: "center",
            }}
            className="js-reveal"
          >
            <svg
              viewBox="0 0 160 160"
              data-float="floatY"
              data-delay="0.5"
              style={{
                width: 118,
                height: "auto",
                margin: "0 auto 20px",
                display: "block",
              }}
              fill="none"
              stroke="#84a9b2"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path data-draw="" d="M28,72 L132,72 L132,138 L28,138 Z" />
              <path
                data-draw=""
                data-delay="0.2"
                d="M22,54 L138,54 L132,72 L28,72 Z"
              />
              <path data-draw="" data-delay="0.4" d="M80,54 L80,138" />
              <path
                data-draw=""
                data-delay="0.55"
                d="M80,54 C66,40 50,40 52,52 C53,60 70,56 80,54 C90,56 107,60 108,52 C110,40 94,40 80,54 Z"
              />
            </svg>
            <p
              style={{
                fontSize: "0.76rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#8a9079",
                margin: "0 0 10px",
              }}
            >
              With gratitude
            </p>
            <h2
              style={{
                fontFamily: "'Tangerine', cursive",
                fontWeight: 400,
                color: G,
                fontSize: "clamp(2.8rem, 7vw, 4.4rem)",
                lineHeight: 1.32,
                paddingBottom: "0.66em",
                margin: "0 0 18px",
              }}
            >
              Gifts
            </h2>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.35rem",
                color: "#5b6051",
                lineHeight: 1.6,
                maxWidth: "44ch",
                margin: "0 auto 30px",
              }}
            >
              Your presence by the sea is the truest gift. If you&apos;d like to
              give something more, we&apos;ve gathered a few ideas in one place.
            </p>
            <a
              href="https://www.zola.com/registry/youssefandsandra"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                textDecoration: "none",
                color: G,
                border: `1px solid ${G}`,
                borderRadius: 999,
                padding: "15px 38px",
                fontSize: "0.78rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              View our registry
            </a>
          </div>
        </section>

        {/* ==================== THANK YOU ==================== */}
        <section
          style={{
            background: G,
            color: "#eef0e6",
            scrollMarginTop: "var(--scroll-offset)",
          }}
        >
          <div
            style={{
              maxWidth: 760,
              margin: "0 auto",
              padding: "clamp(80px, 12vw, 140px) 24px",
              textAlign: "center",
            }}
            className="js-reveal"
          >
            <svg
              viewBox="0 0 220 150"
              data-float="floatY"
              style={{
                width: 160,
                height: "auto",
                margin: "0 auto 26px",
                display: "block",
              }}
              fill="none"
              stroke="#cdd6bd"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle data-draw="" cx="84" cy="86" r="40" />
              <circle data-draw="" data-delay="0.35" cx="138" cy="86" r="40" />
              <path
                data-draw=""
                data-delay="0.7"
                transform="translate(96,18) rotate(-30)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
              <path
                data-draw=""
                data-delay="0.8"
                transform="translate(126,18) rotate(30) scale(-1,1)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
            </svg>
            <h2
              style={{
                fontFamily: "'Tangerine', cursive",
                fontWeight: 400,
                fontSize: "clamp(3rem, 8vw, 5rem)",
                lineHeight: 1.32,
                paddingBottom: "0.66em",
                margin: "0 0 20px",
                color: "#fbfaf3",
              }}
            >
              With all our love
            </h2>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "clamp(1.3rem, 3vw, 1.7rem)",
                lineHeight: 1.55,
                color: "#dfe4d4",
                maxWidth: "42ch",
                margin: "0 auto",
              }}
            >
              Thank you for being part of our story. We can&apos;t wait to feel
              the sea breeze and celebrate this new beginning with you.
            </p>
            <p
              style={{
                fontFamily: "'Tangerine', cursive",
                fontSize: "2.4rem",
                margin: "34px 0 0",
                color: "#fbfaf3",
              }}
            >
              Youssef &amp; Sandra
            </p>
          </div>
          <footer
            style={{
              borderTop: "1px solid rgba(255,255,255,0.16)",
              padding: "26px 24px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.74rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#bcc6ab",
              }}
            >
              Dayra Camp · September 19th · 12:30 PM
            </p>
          </footer>
        </section>
      </div>
    </>
  );
}
