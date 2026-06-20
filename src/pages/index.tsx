import { useEffect, useState, useCallback } from "react";
import NextHead from "next/head";
import { useRouter } from "next/router";
import { searchParties, getParty } from "@/utils/firebase";
import type { Party } from "@/types/rsvp";

const G = "#58674a";
const TEAL = "#46606a";

export default function Home() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Party[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [preloadedParty, setPreloadedParty] = useState<Party | null>(null);

  // Animations
  useEffect(() => {
    // Float animations
    const floatMap: Record<string, string> = {
      floatY: "floatY 6.5s ease-in-out infinite",
      sway: "sway 7s ease-in-out infinite",
      breathe: "breathe 4s ease-in-out infinite",
      wave: "waveDrift 9s ease-in-out infinite",
    };
    document.querySelectorAll<HTMLElement>("[data-float]").forEach((el) => {
      const t = el.getAttribute("data-float") || "floatY";
      const delay = el.getAttribute("data-delay") || "0";
      const anim = floatMap[t] || floatMap.floatY;
      el.style.animation = anim.replace("infinite", `${delay}s infinite`);
    });

    // SVG draw on scroll
    const drawEls = document.querySelectorAll<
      SVGPathElement | SVGCircleElement
    >("[data-draw]");
    drawEls.forEach((p) => {
      let L = 300;
      try {
        if ("getTotalLength" in p)
          L = (p as SVGGeometryElement).getTotalLength();
      } catch {}
      const delay = parseFloat(p.getAttribute("data-delay") || "0");
      p.style.strokeDasharray = String(L);
      p.style.strokeDashoffset = String(L);
      p.style.transition = `stroke-dashoffset 2s cubic-bezier(.45,0,.2,1) ${delay}s`;
    });

    const drawObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.strokeDashoffset = "0";
            drawObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    drawEls.forEach((p) => drawObs.observe(p));

    // Scroll reveal
    const reveals = document.querySelectorAll<HTMLElement>(".js-reveal");
    reveals.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition =
        "opacity 1.1s ease, transform 1.1s cubic-bezier(.2,.7,.2,1)";
    });
    const revObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "none";
            revObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    reveals.forEach((el) => revObs.observe(el));

    return () => {
      drawObs.disconnect();
      revObs.disconnect();
    };
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
      setTimeout(() => {
        document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
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
        <meta property="og:image" content="/open-graphs_optimized_300.png" />
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
                  href="#venue"
                  style={{ color: "#6c7261", textDecoration: "none" }}
                >
                  Venue
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
            scrollMarginTop: 88,
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

            <svg
              viewBox="0 0 480 168"
              data-float="sway"
              style={{
                width: "min(440px, 72vw)",
                height: "auto",
                display: "block",
                margin: "14px auto -6px",
              }}
              fill="none"
              stroke="#7e8c6a"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                data-draw=""
                d="M40,158 C40,72 196,26 240,26 C284,26 440,72 440,158"
              />
              <path
                data-draw=""
                data-delay="0.25"
                transform="translate(74,120) rotate(-58)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
              <path
                data-draw=""
                data-delay="0.35"
                transform="translate(102,92) rotate(-50)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
              <path
                data-draw=""
                data-delay="0.45"
                transform="translate(136,64) rotate(-40)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
              <path
                data-draw=""
                data-delay="0.55"
                transform="translate(176,44) rotate(-26)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
              <path
                data-draw=""
                data-delay="0.6"
                transform="translate(216,32) rotate(-10)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
              <path
                data-draw=""
                data-delay="0.6"
                transform="translate(262,32) rotate(14) scale(-1,1)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
              <path
                data-draw=""
                data-delay="0.55"
                transform="translate(304,44) rotate(28) scale(-1,1)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
              <path
                data-draw=""
                data-delay="0.45"
                transform="translate(344,64) rotate(42) scale(-1,1)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
              <path
                data-draw=""
                data-delay="0.35"
                transform="translate(378,92) rotate(52) scale(-1,1)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
              <path
                data-draw=""
                data-delay="0.25"
                transform="translate(406,120) rotate(60) scale(-1,1)"
                d="M0,0 C7,-6 18,-3 22,7 C12,10 3,8 0,0 Z"
              />
            </svg>

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
                width: "100%",
                height: "clamp(300px, 46vw, 560px)",
                borderRadius: 22,
                overflow: "hidden",
              }}
            >
              <img
                src="/a25a43cc-590f-4e8c-8e98-994545598a4f.JPG"
                alt="Youssef and Sandra"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          </div>
        </section>

        {/* ==================== CEREMONY ==================== */}
        <section
          id="ceremony"
          style={{ background: "#faf8f1", scrollMarginTop: 72 }}
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
              <div
                style={{
                  background: "#eef0e6",
                  border: "1px solid rgba(88,103,74,0.16)",
                  borderRadius: 14,
                  padding: "18px 22px",
                  maxWidth: "42ch",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    color: "#5b6051",
                  }}
                >
                  <strong style={{ color: "#58674a" }}>Gentlemen —</strong> Suits
                  and linen suits warmly welcomed for the sand and sun. No smart
                  casual, please.
                  <br />
                  <br />
                  <strong style={{ color: "#58674a" }}>Ladies —</strong> Elegant
                  dresses or formal separates. Think florals, flowing silhouettes,
                  and soft colours that belong by the sea.
                </p>
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

        {/* ==================== RECEPTION ==================== */}
        <section
          id="reception"
          style={{ background: "#ece5d4", scrollMarginTop: 72 }}
        >
          <div
            style={{
              maxWidth: 1000,
              margin: "0 auto",
              padding: "clamp(72px, 11vw, 128px) 24px",
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
              Long tables on the sand, the sea in front of us, and the evening
              unfolding slowly into the night.
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
                { time: "2:30", label: "Welcome drinks" },
                { time: "3:30", label: "Lunch by the sea" },
                { time: "5:30", label: "Toasts & first dance" },
                { time: "7:00", label: "Dancing till sunset" },
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
        </section>

        {/* ==================== VENUE ==================== */}
        <section
          id="venue"
          style={{ background: "#e6eef0", scrollMarginTop: 72 }}
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
            <div style={{ order: 2 }}>
              <div
                style={{
                  width: "100%",
                  height: "clamp(280px, 40vw, 420px)",
                  borderRadius: 20,
                  background: "#c8dade",
                  boxShadow: "0 22px 50px -26px rgba(60,90,95,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: TEAL,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    fontSize: "1.2rem",
                  }}
                >
                  A photo of Dayra Camp
                </span>
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
              <svg
                viewBox="0 0 240 170"
                style={{
                  width: 96,
                  height: "auto",
                  margin: "0 0 6px",
                  display: "block",
                }}
                fill="none"
                stroke="#6f9aa4"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  data-draw=""
                  d="M40,40 q14,-12 28,0 M168,30 q14,-12 28,0"
                />
                <path
                  data-draw=""
                  data-delay="0.25"
                  d="M30,150 L120,40 L210,150 Z"
                />
                <path
                  data-draw=""
                  data-delay="0.5"
                  d="M120,150 L100,92 M120,150 L140,92"
                />
                <path data-draw="" data-delay="0.65" d="M10,150 L230,150" />
              </svg>
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
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.35rem",
                  color: "#52636a",
                  lineHeight: 1.5,
                  margin: "0 0 18px",
                  maxWidth: "40ch",
                }}
              >
                A quiet stretch of coast where the desert meets the water — open
                tents, warm light, and nothing between us and the horizon.
              </p>
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
          style={{ background: "#f5f1e6", scrollMarginTop: 72 }}
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
                  <button
                    type="submit"
                    disabled={isSearching || !searchTerm.trim()}
                    style={{
                      width: "100%",
                      background:
                        isSearching || !searchTerm.trim() ? "#b9bea8" : G,
                      color: "#f5f1e6",
                      border: "none",
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
                  </button>
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
          style={{ background: "#faf8f1", scrollMarginTop: 72 }}
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
              Your presence on the sand is the truest gift. If you&apos;d like
              to give something more, we&apos;ve gathered a few ideas in one
              place.
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
          style={{ background: G, color: "#eef0e6", scrollMarginTop: 72 }}
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
              the sand beneath our feet and celebrate this new beginning with
              you.
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
