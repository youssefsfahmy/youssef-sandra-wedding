import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getHeaderHeight } from "@/utils/headerHeight";
const SHRINK_EASE = [0.34, 1.4, 0.5, 1] as const;

type IntroStage = "paused" | "playing" | "done";

interface IntroOverlayProps {
  stage: IntroStage;
  videoRef: React.RefObject<HTMLVideoElement>;
  onEnter: () => void;
  onFinished: () => void;
}

const WelcomeText: React.FC<{
  paused: boolean;
  shrink: { opacity: number; scale: number };
}> = ({ paused, shrink }) => {
  return (
    <motion.div
      initial={false}
      animate={{
        ...shrink,
        filter: paused ? "blur(0px)" : "blur(6px)",
      }}
      transition={{ delay: 1, duration: 1, ease: SHRINK_EASE }}
      className="absolute top-[14.5%] -translate-x-1/2 w-full text-center"
    >
      <p className="mb-[0.5vw] text-[3.5vw] xs:text-[16px] uppercase tracking-[0.34em] text-sage-muted">
        The wedding of
      </p>
      <p className="m-0 font-tangerine text-[13vw] xs:text-[64px] font-normal leading-none text-sage">
        Youssef &amp; Sandra
      </p>
    </motion.div>
  );
};

const WelcomeButton: React.FC<{
  paused: boolean;
  shrink: { opacity: number; scale: number };
}> = ({ paused, shrink }) => {
  return (
    <motion.div
      initial={false}
      animate={{ ...shrink, filter: paused ? "blur(0px)" : "blur(6px)" }}
      transition={{ delay: 1, duration: 1, ease: SHRINK_EASE }}
      className="absolute bottom-[19.5%]  -translate-x-1/2 w-full text-center"
    >
      <button
        type="button"
        className="absolute bottom-[19.5%] left-1/2 transform -translate-x-1/2 z-[2] inline-block w-[63%] cursor-pointer rounded-full border-none bg-sage px-[1.5vw] py-[3.9%] font-mulish text-[3.5vw] xs:text-[16px] font-semibold uppercase text-cream"
      >
        View Invitation
      </button>
    </motion.div>
  );
};

const IntroOverlay: React.FC<IntroOverlayProps> = ({
  stage,
  videoRef,
  onEnter,
  onFinished,
}) => {
  const [headerHeight, setHeaderHeight] = useState(100);

  useEffect(() => {
    setHeaderHeight(getHeaderHeight());
    const handleResize = () => setHeaderHeight(getHeaderHeight());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (stage === "done") {
    return null;
  }

  return (
    <div
      className="relative w-full bg-[#f7f3ea] z-50"
      style={{ marginTop: `-${headerHeight + 50}px` }}
    >
      <div className="relative  max-w-[400px] mx-auto " onClick={onEnter}>
        <video
          ref={videoRef}
          poster="/intro-couple-first.png"
          muted
          playsInline
          preload="auto"
          onEnded={onFinished}
          className=""
        >
          <source src="/intro-couple.mp4" type="video/mp4" />
        </video>

        <WelcomeText
          paused={stage === "paused"}
          shrink={{
            opacity: stage === "paused" ? 1 : 0,
            scale: stage === "paused" ? 1 : 0.3,
          }}
        />
        <WelcomeButton
          paused={stage === "paused"}
          shrink={{
            opacity: stage === "paused" ? 1 : 0,
            scale: stage === "paused" ? 1 : 0.3,
          }}
        />
      </div>
    </div>
  );
};

export default IntroOverlay;
