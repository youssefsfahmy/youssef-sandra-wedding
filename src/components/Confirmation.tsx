import React from "react";
import { motion } from "motion/react";
import type { Guest, GuestRSVP, Party } from "@/types/rsvp";
import { useRouter } from "next/router";

interface ConfirmationProps {
  party: Party;
  guests: Guest[];
  rsvpsByGuest: Record<string, GuestRSVP>;
  confirmationCode?: string;
  isSubmitted: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
  handleMessageChange: (message: string) => void;
  transport?: boolean;
}

const G = "#58674a";

const Confirmation: React.FC<ConfirmationProps> = ({
  party,
  guests,
  rsvpsByGuest,
  confirmationCode,
  onSubmit,
  isSubmitting,
  handleMessageChange,
  transport,
}) => {
  const router = useRouter();

  if (confirmationCode) {
    return (
      <motion.div
        style={{ textAlign: "center", padding: "12px 0" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <svg
          viewBox="0 0 80 80"
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 20px",
            display: "block",
          }}
          fill="none"
          stroke={G}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.circle
            cx="40"
            cy="40"
            r="34"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
          <motion.path
            d="M24,40 L34,50 L56,30"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.5, ease: "easeOut" }}
          />
        </svg>
        <p
          style={{
            fontFamily: "'Tangerine', cursive",
            fontSize: "2.2rem",
            color: G,
            margin: "0 0 10px",
          }}
        >
          We&apos;re thrilled!
        </p>
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "1.2rem",
            color: "#7d8270",
            margin: "0 0 28px",
            lineHeight: 1.6,
          }}
        >
          Your reply has been received. We can&apos;t wait to see you by the
          sea.
        </p>
        <p
          style={{
            fontSize: "0.78rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#9a9a8a",
            margin: "0 0 28px",
          }}
        >
          If anything changes, just reach out to us directly.
        </p>
        <button
          onClick={() => router.push("/")}
          style={{
            background: G,
            color: "#f5f1e6",
            border: "none",
            padding: "14px 36px",
            borderRadius: 999,
            fontSize: "0.78rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back to the invitation
        </button>
      </motion.div>
    );
  }

  const attending = guests.filter((g) => rsvpsByGuest[g.id]?.rsvp === "yes");
  const notAttending = guests.filter((g) => rsvpsByGuest[g.id]?.rsvp === "no");
  const plusOne = Object.values(rsvpsByGuest).find(
    (g) => g.isPlusOne && g.firstName.trim(),
  );

  return (
    <div>
      <p
        style={{
          fontSize: "0.72rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "#8a9079",
          margin: "0 0 8px",
        }}
      >
        Almost done
      </p>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: "1.15rem",
          color: "#7d8270",
          margin: "0 0 28px",
        }}
      >
        Review your reply before sending it our way.
      </p>

      {/* Summary */}
      <div
        style={{
          background: "#eef0e6",
          border: "1px solid rgba(88,103,74,0.16)",
          borderRadius: 14,
          padding: "20px 22px",
          marginBottom: 20,
        }}
      >
        {party.partyLabel && (
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.1rem",
              color: G,
              margin: "0 0 10px",
              fontWeight: 500,
            }}
          >
            {party.partyLabel}
          </p>
        )}
        {(attending.length > 0 || plusOne) && (
          <div style={{ marginBottom: notAttending.length > 0 ? 10 : 0 }}>
            <p
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: G,
                margin: "0 0 5px",
              }}
            >
              Attending
            </p>
            {attending.map((g) => (
              <p
                key={g.id}
                style={{
                  margin: "2px 0",
                  fontSize: "0.95rem",
                  color: "#474b40",
                }}
              >
                {g.firstName} {g.lastName}
              </p>
            ))}
            {plusOne && (
              <p
                style={{
                  margin: "2px 0",
                  fontSize: "0.95rem",
                  color: "#474b40",
                }}
              >
                {plusOne.firstName}{" "}
                <span style={{ color: "#8a9079", fontSize: "0.8rem" }}>
                  (plus one)
                </span>
              </p>
            )}
          </div>
        )}
        {notAttending.length > 0 && (
          <div>
            <p
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#9a9a8a",
                margin: "0 0 5px",
              }}
            >
              Not attending
            </p>
            {notAttending.map((g) => (
              <p
                key={g.id}
                style={{
                  margin: "2px 0",
                  fontSize: "0.95rem",
                  color: "#9a9a8a",
                }}
              >
                {g.firstName} {g.lastName}
              </p>
            ))}
          </div>
        )}
        {transport === true && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid rgba(88,103,74,0.14)",
            }}
          >
            <p
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#8a9079",
                margin: "0 0 3px",
              }}
            >
              Transportation
            </p>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#474b40" }}>
              Joining the bus
            </p>
          </div>
        )}
      </div>

      {/* Message */}
      <div style={{ marginBottom: 28 }}>
        <label>
          <span
            style={{
              display: "block",
              fontSize: "0.72rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#9a9a8a",
              marginBottom: 10,
            }}
          >
            A note for Youssef &amp; Sandra
          </span>
          <textarea
            placeholder="Wishes, a memory, anything — entirely optional"
            rows={3}
            value={party.message || ""}
            onChange={(e) => handleMessageChange(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid rgba(88,103,74,0.22)",
              borderRadius: 12,
              background: "transparent",
              padding: "12px 14px",
              fontSize: "1rem",
              color: "#474b40",
              outline: "none",
              resize: "vertical",
              fontFamily: "'Mulish', sans-serif",
              boxSizing: "border-box",
            }}
          />
        </label>
      </div>

      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        style={{
          width: "100%",
          background: isSubmitting ? "#9a9a8a" : G,
          color: "#f5f1e6",
          border: "none",
          padding: 18,
          borderRadius: 999,
          fontSize: "0.8rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
          cursor: isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            Sending…
          </span>
        ) : (
          "Send our reply"
        )}
      </button>
    </div>
  );
};

export default Confirmation;
