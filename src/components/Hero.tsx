import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { scrollToSection } from "@/utils/scroll";

const G = "#58674a";

// useLayoutEffect on the client, useEffect on the server (avoids SSR warning)
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const Hero: React.FC = () => {
  // ---- Intro ----
  // Paused: couple video's first frame (poster) + text. Click plays the couple
  // video once, then reveals the site; the sparkles then loop behind the hero.
  const [introStage, setIntroStage] = useState<"paused" | "playing" | "done">(
    "paused",
  );
  const coupleVideoRef = useRef<HTMLVideoElement>(null);
  const introRanRef = useRef(false);

  // Deep links (e.g. /#rsvp) skip the intro entirely so the browser can
  // scroll straight to the section.
  useIsoLayoutEffect(() => {
    const hash = window.location.hash;
    if (hash && hash !== "#" && hash !== "#top") {
      setIntroStage("done");
      requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock the page while the intro is on screen
  useEffect(() => {
    if (introStage !== "done") {
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
    introRanRef.current = true;
    setIntroStage("playing");
    coupleVideoRef.current?.play().catch(() => {});
    // Fallback in case the video's `ended` event never fires (load error).
    window.setTimeout(() => setIntroStage("done"), 9000);
  }, [introStage]);

  const introActive = introStage !== "done";

  return (
    <>
      {/* ==================== INTRO ==================== */}
      {/* Paused first frame + text; click plays the couple video once, then
          reveals the site (sparkles then loop behind the hero). */}
      <AnimatePresence>
        {introActive && (
          <motion.div
            key="intro"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            onClick={handleViewInvite}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "#f5f1e6",
              overflow: "hidden",
            }}
          >
            {/* Couple — poster (first frame) until clicked, then plays once */}
            <video
              ref={coupleVideoRef}
              poster="/intro-couple-first.png"
              muted
              playsInline
              preload="auto"
              onEnded={() => setIntroStage("done")}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                maxWidth: "400px",
                marginRight: "auto",
                marginLeft: "auto",
                objectFit: "contain",
                zIndex: 1,
                pointerEvents: "none",
              }}
            >
              <source src="/intro-couple.mp4 " type="video/mp4" />
            </video>
            {/* Prompt — shrinks away (scale + fade + blur) once tapped */}
            <motion.div
              initial={false}
              animate={{
                opacity: introStage === "paused" ? 1 : 0,
                scale: introStage === "paused" ? 1 : 0.3,
                filter: introStage === "paused" ? "blur(0px)" : "blur(6px)",
              }}
              transition={{ duration: 1, ease: [0.34, 1.4, 0.5, 1] }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "clamp(36px, 8vh, 84px)",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
                top: "15%",
                transformOrigin: "center",
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
            </motion.div>

            {/* Real button placed over the poster's baked-in "View invitation"
                pill — shrinks + fades away when tapped. */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "15%",
                zIndex: 3,
                display: "flex",
                justifyContent: "center",
                pointerEvents: introStage === "paused" ? "auto" : "none",
              }}
            >
              <motion.button
                type="button"
                onClick={handleViewInvite}
                initial={false}
                animate={{
                  opacity: introStage === "paused" ? 1 : 0,
                  scale: introStage === "paused" ? 1 : 0.3,
                  // filter: introStage === "paused" ? "blur(0px)" : "blur(6px)",
                }}
                transition={{ duration: 1, ease: [0.34, 1.4, 0.5, 1] }}
                whileTap={{ scale: 0.94 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  width: "min(62%, 260px)",
                  background: G,
                  color: "#f5f1e6",
                  border: "none",
                  cursor: "pointer",
                  padding: "18px 18px",
                  borderRadius: 999,
                  fontFamily: "'Mulish', sans-serif",
                  fontSize: "0.72rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                View invitation
                <svg
                  width="26"
                  height="10"
                  viewBox="0 0 26 10"
                  fill="none"
                  stroke="#f5f1e6"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M0 5h24M20 1l4 4-4 4" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== HERO ==================== */}
      <section
        className="hero-section"
        style={{
          position: "relative",
          // minHeight: "92vh",
          marginTop: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "84px 24px 52px",
          scrollMarginTop: "var(--scroll-offset)",
        }}
      >
        {/* Sparkles — loop behind the hero once the intro is done */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: introStage === "done" ? 1 : 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <Image
            src="/intro-sparkles.gif"
            alt=""
            fill
            unoptimized
            sizes="100vw"
            style={{
              objectFit: "cover",
              maxWidth: "400px",
              marginRight: "auto",
              marginLeft: "auto",
            }}
          />
        </motion.div>

        {/* Couple illustration above the names — intro's final frame */}
        <Image
          src="/intro-couple-last.png"
          alt="Youssef and Sandra"
          loading="eager"
          width={1217}
          height={1822}
          draggable={false}
          style={{
            position: "relative",
            zIndex: 1,
            width: "84vw",
            maxWidth: "340px",
            height: "auto",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
        <button
          type="button"
          onClick={() => scrollToSection("rsvp")}
          style={{
            position: "absolute",
            bottom: "52px",
            zIndex: 2,
            display: "inline-block",
            background: G,
            color: "#f5f1e6",
            border: "none",
            cursor: "pointer",
            padding: "11px 7px",
            borderRadius: 999,
            fontSize: "0.725rem",
            textTransform: "uppercase",
            fontWeight: 600,
            width: "200px",
            fontFamily: "'Mulish', sans-serif",
          }}
        >
          RSVP by August 15th
        </button>

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
    </>
  );
};

export default Hero;
