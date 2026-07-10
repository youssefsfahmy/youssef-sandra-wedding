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

// useLayoutEffect on the client, useEffect on the server (avoids SSR warning)
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const SHRINK_EASE = [0.34, 1.4, 0.5, 1] as const;

type IntroStage = "paused" | "playing" | "done";

/* ------------------------------------------------------------------ */
/* Intro splash                                                        */
/* ------------------------------------------------------------------ */

interface IntroOverlayProps {
  stage: IntroStage;
  videoRef: React.RefObject<HTMLVideoElement>;
  onEnter: () => void;
  onFinished: () => void;
}

function IntroOverlay({
  stage,
  videoRef,
  onEnter,
  onFinished,
}: IntroOverlayProps) {
  const paused = stage === "paused";
  const shrink = {
    opacity: paused ? 1 : 0,
    scale: paused ? 1 : 0.3,
  };

  return (
    <AnimatePresence>
      {stage !== "done" && (
        <motion.div
          key="intro"
          onClick={onEnter}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] max-h-[190vw] min-h-[100vh] overflow-hidden bg-cream "
        >
          {/* Couple — poster (first frame) until tapped, then plays once */}

          <video
            ref={videoRef}
            poster="/intro-couple-first.png"
            muted
            playsInline
            preload="auto"
            onEnded={onFinished}
            className="pointer-events-none absolute inset-0 z-[1] mx-auto w-full object-contain"
          >
            <source src="/intro-couple.mp4" type="video/mp4" />
          </video>

          {/* Prompt — shrinks + fades + blurs away once tapped */}
          <motion.div
            initial={false}
            animate={{ ...shrink, filter: paused ? "blur(0px)" : "blur(6px)" }}
            transition={{ duration: 1, ease: SHRINK_EASE }}
            className={`absolute inset-x-0 z-[2] flex  origin-center flex-col items-center gap-[4vw] px-[5.5vw] text-center ${
              paused ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            <div className="mt-[30%]">
              <p className="mb-[0.5vw] text-[0.72rem] uppercase tracking-[0.34em] text-sage-muted">
                The wedding of
              </p>
              <p className="m-0 font-tangerine text-[clamp(2.6rem,9vw,3.8rem)] font-normal leading-none text-sage">
                Youssef &amp; Sandra
              </p>
            </div>
          </motion.div>

          {/* Real button over the poster's baked-in "View invitation" pill */}
          <div
            className={`absolute inset-x-0 top-[74.9%] z-[3] flex justify-center ${
              paused ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            <motion.button
              type="button"
              onClick={onEnter}
              initial={false}
              animate={shrink}
              transition={{ duration: 1, ease: SHRINK_EASE }}
              whileTap={{ scale: 0.94 }}
              className="inline-flex w-[62vw] cursor-pointer items-center justify-center gap-[3vw] rounded-full border-none bg-sage p-[4vw] font-mulish text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cream"
            >
              View invitation
              <svg
                viewBox="0 0 26 10"
                fill="none"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-[2.5vw] w-[6vw] stroke-cream"
              >
                <path d="M0 5h24M20 1l4 4-4 4" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Wave divider at the foot of the hero                                */
/* ------------------------------------------------------------------ */

function WaveDivider() {
  return (
    <svg
      viewBox="0 0 1200 130"
      preserveAspectRatio="none"
      data-float="wave"
      data-draw-margin="0px 0px -30% 0px"
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      className="absolute bottom-0 left-[-3vw] z-[1] h-[30vw] w-[106vw] stroke-wave"
    >
      <path
        data-draw=""
        d="M0,74 C150,44 300,104 450,74 C600,44 750,104 900,74 C1050,44 1150,94 1200,74"
      />
      <path
        data-draw=""
        data-delay="0.2"
        className="opacity-70"
        d="M0,96 C160,70 320,120 480,96 C640,72 800,118 960,96 C1080,78 1150,108 1200,96"
      />
      <path
        data-draw=""
        data-delay="0.4"
        className="opacity-[0.45]"
        d="M0,116 C180,96 360,134 540,116 C720,98 900,134 1080,116 C1140,110 1170,120 1200,116"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const Hero: React.FC = () => {
  // Paused: couple video's first frame (poster) + text. Tap plays the couple
  // video once, then reveals the site; the sparkles then loop behind the hero.
  const [introStage, setIntroStage] = useState<IntroStage>("paused");
  const coupleVideoRef = useRef<HTMLVideoElement>(null);
  const introRanRef = useRef(false);

  // Deep links (e.g. /#rsvp) skip the intro so the browser can scroll straight
  // to the section.
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
    setIntroStage((prev) => {
      if (prev !== "paused") return prev;
      introRanRef.current = true;
      coupleVideoRef.current?.play().catch(() => {});
      // Fallback if the video's `ended` event never fires (load error).
      window.setTimeout(() => setIntroStage("done"), 9000);
      return "playing";
    });
  }, []);

  return (
    <>
      <IntroOverlay
        stage={introStage}
        videoRef={coupleVideoRef}
        onEnter={handleViewInvite}
        onFinished={() => setIntroStage("done")}
      />

      <section className="relative flex flex-col items-center justify-center text-center -mt-[100px] max-w-screen-sm mx-auto">
        {/* Sparkles — loop behind the hero once the intro is done */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: introStage === "done" ? 1 : 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 z-0"
        >
          <Image
            src="/intro-sparkles.gif"
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="mx-auto max-w-[93vw] object-cover"
          />
        </motion.div>

        {/* Couple illustration — intro's final frame */}
        <Image
          src="/intro-couple-last.png"
          alt="Youssef and Sandra"
          loading="eager"
          height={1206}
          width={2622}
          sizes="100vw"
          draggable={false}
          className="pointer-events-none relative z-[1] block h-auto w-[100vw] select-none"
        />
        <button
          type="button"
          onClick={() => scrollToSection("rsvp")}
          className="absolute bottom-[10.1%] z-[2] inline-block w-[46vw] cursor-pointer rounded-full border-none bg-sage px-[1.5vw] py-[2.5vw] font-mulish text-[3.5vw] font-semibold uppercase text-cream"
        >
          RSVP by August 15th
        </button>

        <WaveDivider />
      </section>
    </>
  );
};

export default Hero;
