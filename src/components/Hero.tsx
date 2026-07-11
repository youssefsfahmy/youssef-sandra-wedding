import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { scrollToSection } from "@/utils/scroll";
import { getHeaderHeight } from "@/utils/headerHeight";
import IntroOverlay from "./IntroOverlay";

// useLayoutEffect on the client, useEffect on the server (avoids SSR warning)
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type IntroStage = "paused" | "playing" | "done";

/* ------------------------------------------------------------------ */
/* Intro splash                                                        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Wave divider at the foot of the hero                                */
/* ------------------------------------------------------------------ */

function WaveDivider() {
  return (
    <svg
      viewBox="0 0 2400 130"
      preserveAspectRatio="none"
      data-float="wave"
      data-draw-margin="0px 0px -30% 0px"
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      className="absolute bottom-0 left-[-50vw] z-[1] h-[30vw] w-[200vw] sm:w-[120vw] xs:left-[-37vw] xs:bottom-0 xs:h-64 stroke-wave"
    >
      <path
        data-draw=""
        d="M0,74 C160,44 320,104 480,74 C640,44 800,104 960,74 C1120,44 1280,104 1440,74 C1600,44 1760,104 1920,74 C2080,44 2240,104 2400,74"
      />
      <path
        data-draw=""
        data-delay="0.2"
        className="opacity-70"
        d="M0,96 C160,70 320,120 480,96 C640,70 800,120 960,96 C1120,70 1280,120 1440,96 C1600,70 1760,120 1920,96 C2080,70 2240,120 2400,96"
      />
      <path
        data-draw=""
        data-delay="0.4"
        className="opacity-[0.45]"
        d="M0,116 C160,96 320,134 480,116 C640,96 800,134 960,116 C1120,96 1280,134 1440,116 C1600,96 1760,134 1920,116 C2080,96 2240,134 2400,116"
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
  const [headerHeight, setHeaderHeight] = useState(0);
  const coupleVideoRef = useRef<HTMLVideoElement>(null);
  const introRanRef = useRef(false);

  useEffect(() => {
    setHeaderHeight(getHeaderHeight());
    const handleResize = () => setHeaderHeight(getHeaderHeight());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

      <section
        className="bg-[#f7f3ea] relative flex flex-col items-center justify-center text-center  max-w-[400px]  mx-auto"
        style={{ marginTop: `-${headerHeight + 50}px` }}
      >
        {/* Sparkles — loop behind the hero once the intro is done */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
          src="/intro-couple-last-awi.png"
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
          className="absolute bottom-[10.1%] z-[2] inline-block w-[52%] cursor-pointer rounded-full border-none bg-sage px-[1.5%] py-[2.5%] font-mulish text-[3.5vw] xs:text-[14px] font-semibold uppercase text-cream"
        >
          RSVP by August 15th
        </button>{" "}
        <WaveDivider />
      </section>
    </>
  );
};

export default Hero;
