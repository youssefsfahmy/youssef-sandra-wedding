import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import NextHead from "next/head";
import { getPartyByConfirmationCode } from "@/utils/firebase";
import type { Party } from "@/types/rsvp";

const G = "#58674a";

const SubmissionViewPage: React.FC = () => {
  const router = useRouter();
  const { id: confirmationCode } = router.query;

  const [party, setParty] = useState<Party | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmationCode || typeof confirmationCode !== "string") return;
    getPartyByConfirmationCode(confirmationCode).then((data) => {
      if (!data?.confirmationCode) {
        setError("We couldn't find that RSVP. Please check your link and try again.");
      } else {
        setParty(data);
      }
    }).catch(() => {
      setError("Something went wrong. Please try again later.");
    }).finally(() => setIsLoading(false));
  }, [confirmationCode]);

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f5f1e6",
    fontFamily: "'Mulish', sans-serif",
    color: "#474b40",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 540,
    background: "#faf8f1",
    border: "1px solid rgba(88,103,74,0.16)",
    borderRadius: 20,
    padding: "40px 36px",
  };

  const logo = (
    <a href="/" style={{ fontFamily: "'Tangerine', cursive", fontSize: "1.7rem", color: G, textDecoration: "none", display: "block", textAlign: "center", marginBottom: 28 }}>
      Y &amp; S
    </a>
  );

  if (isLoading) {
    return (
      <div style={pageStyle}>
        {logo}
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.2rem", color: "#7d8270" }}>
          Fetching your reply…
        </p>
      </div>
    );
  }

  if (error || !party) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          {logo}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#9a9a8a", margin: "0 0 12px" }}>
              We couldn&apos;t find that reply
            </p>
            <p style={{ fontSize: "0.9rem", color: "#7d8270", margin: "0 0 28px", lineHeight: 1.6 }}>
              {error}
            </p>
            <button
              onClick={() => router.push("/")}
              style={{ background: G, color: "#f5f1e6", border: "none", padding: "13px 32px", borderRadius: 999, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer" }}
            >
              Back to the invitation
            </button>
          </div>
        </div>
      </div>
    );
  }

  const attending = (party.guests || []).filter((g) => g.rsvp === "yes");
  const notAttending = (party.guests || []).filter((g) => g.rsvp === "no");
  const allDeclined = attending.length === 0 && notAttending.length > 0;

  return (
    <>
      <NextHead>
        <title>Your RSVP — Youssef &amp; Sandra</title>
      </NextHead>
      <div style={pageStyle}>
        <div style={cardStyle}>
          {logo}

          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <p style={{ fontFamily: "'Tangerine', cursive", fontSize: "clamp(2rem, 6vw, 2.8rem)", color: G, margin: "0 0 10px", lineHeight: 1.2 }}>
              {allDeclined ? "We'll miss you." : "See you on the sand."}
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.15rem", color: "#7d8270", margin: 0, lineHeight: 1.6 }}>
              {allDeclined
                ? "Your reply has been saved. We're sorry you can't make it — you'll be missed."
                : "Your reply has been saved. We can't wait to celebrate with you."}
            </p>
          </div>

          {/* Summary card */}
          <div style={{ background: "#eef0e6", border: "1px solid rgba(88,103,74,0.16)", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
            {party.partyLabel && (
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: G, margin: "0 0 12px", fontWeight: 500 }}>{party.partyLabel}</p>
            )}

            {attending.length > 0 && (
              <div style={{ marginBottom: notAttending.length > 0 ? 10 : 0 }}>
                <p style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: G, margin: "0 0 5px" }}>Attending</p>
                {attending.map((g, i) => (
                  <p key={i} style={{ margin: "2px 0", fontSize: "0.95rem", color: "#474b40" }}>{g.firstName} {g.lastName}</p>
                ))}
              </div>
            )}

            {notAttending.length > 0 && (
              <div>
                <p style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#9a9a8a", margin: "0 0 5px" }}>Not attending</p>
                {notAttending.map((g, i) => (
                  <p key={i} style={{ margin: "2px 0", fontSize: "0.95rem", color: "#9a9a8a" }}>{g.firstName} {g.lastName}</p>
                ))}
              </div>
            )}

            {party.transport === true && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(88,103,74,0.14)" }}>
                <p style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a9079", margin: "0 0 3px" }}>Transportation</p>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "#474b40" }}>Joining the bus</p>
              </div>
            )}
          </div>

          {/* Message */}
          {party.message && (
            <div style={{ marginBottom: 20, padding: "16px 20px", borderLeft: `3px solid rgba(88,103,74,0.3)` }}>
              <p style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a9079", margin: "0 0 6px" }}>Your note</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.1rem", color: "#5b6051", margin: 0, lineHeight: 1.6 }}>
                &ldquo;{party.message}&rdquo;
              </p>
            </div>
          )}

          {/* Footer note */}
          <p style={{ fontSize: "0.8rem", color: "#9a9a8a", textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>
            Need to make a change? Reach out to us directly and we&apos;ll sort it.
          </p>

          <button
            onClick={() => router.push("/")}
            style={{ width: "100%", background: G, color: "#f5f1e6", border: "none", padding: 16, borderRadius: 999, fontSize: "0.78rem", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer" }}
          >
            Back to the invitation
          </button>
        </div>
      </div>
    </>
  );
};

export default SubmissionViewPage;
