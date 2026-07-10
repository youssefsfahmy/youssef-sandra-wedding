import React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Guest, GuestRSVP, YesNo } from "@/types/rsvp";

interface WeddingRSVPProps {
  guests: Guest[];
  rsvpsByGuest: Record<string, GuestRSVP>;
  onRSVPChange: (guestId: string, rsvp: YesNo) => void;
  transport?: boolean;
  onTransportChange: (value: boolean) => void;
  allowPlusOne?: boolean;
  plusOne?: GuestRSVP;
  onAddPlusOne?: () => void;
  onRemovePlusOne?: () => void;
  onPlusOneNameChange?: (name: string) => void;
}

const G = "#58674a";

const WeddingRSVP: React.FC<WeddingRSVPProps> = ({
  guests,
  rsvpsByGuest,
  onRSVPChange,
  transport,
  onTransportChange,
  allowPlusOne = false,
  plusOne,
  onAddPlusOne,
  onRemovePlusOne,
  onPlusOneNameChange,
}) => {
  const someoneAttending = guests.some(
    (g) => rsvpsByGuest[g.id]?.rsvp === "yes",
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
        Will you join us?
      </p>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: "1.15rem",
          color: "#7d8270",
          margin: "0 0 32px",
        }}
      >
        Let us know if we can count on your presence.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {guests.map((guest) => {
          const rsvp = rsvpsByGuest[guest.id]?.rsvp;
          return (
            <div
              key={guest.id}
              style={{
                borderBottom: "1px solid rgba(88,103,74,0.14)",
                paddingBottom: 20,
              }}
            >
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.4rem",
                  color: "#474b40",
                  margin: "0 0 14px",
                  fontWeight: 500,
                }}
              >
                {guest.firstName} {guest.lastName}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <motion.button
                  type="button"
                  onClick={() => onRSVPChange(guest.id, "yes")}
                  whileTap={{ scale: 0.96 }}
                  animate={{
                    backgroundColor: rsvp === "yes" ? G : "rgba(88,103,74,0)",
                    borderColor: rsvp === "yes" ? G : "rgba(88,103,74,0.3)",
                    color: rsvp === "yes" ? "#f5f1e6" : "#6c7261",
                  }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderStyle: "solid",
                    fontSize: "0.78rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Mulish', sans-serif",
                  }}
                >
                  Joyfully accepts
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => onRSVPChange(guest.id, "no")}
                  whileTap={{ scale: 0.96 }}
                  animate={{
                    backgroundColor:
                      rsvp === "no" ? "#9a9a8a" : "rgba(154,154,138,0)",
                    borderColor:
                      rsvp === "no" ? "#9a9a8a" : "rgba(88,103,74,0.3)",
                    color: rsvp === "no" ? "#f5f1e6" : "#9a9a8a",
                  }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderStyle: "solid",
                    fontSize: "0.78rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Mulish', sans-serif",
                  }}
                >
                  Regretfully declines
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plus one — only when the party is allowed one */}
      <AnimatePresence initial={false}>
        {allowPlusOne && someoneAttending && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 28 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "22px 24px",
                background: "#eef0e6",
                border: "1px solid rgba(88,103,74,0.16)",
                borderRadius: 14,
              }}
            >
              <p
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#8a9079",
                  margin: "0 0 6px",
                }}
              >
                Plus one
              </p>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.2rem",
                  color: "#474b40",
                  margin: "0 0 4px",
                  fontWeight: 500,
                }}
              >
                Bringing someone along?
              </p>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#7d8270",
                  margin: "0 0 16px",
                  lineHeight: 1.5,
                }}
              >
                Feel free to bring a plus-one to celebrate with us.
              </p>

              {plusOne ? (
                <div>
                  <input
                    type="text"
                    value={plusOne.firstName}
                    onChange={(e) => onPlusOneNameChange?.(e.target.value)}
                    placeholder="Your guest's name"
                    autoFocus
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1.5px solid rgba(88,103,74,0.3)",
                      background: "#faf8f1",
                      fontSize: "1rem",
                      color: "#474b40",
                      fontFamily: "'Mulish', sans-serif",
                      outline: "none",
                      marginBottom: 12,
                    }}
                  />
                  <button
                    type="button"
                    onClick={onRemovePlusOne}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#9a9a8a",
                      fontSize: "0.72rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: "'Mulish', sans-serif",
                    }}
                  >
                    Remove plus one
                  </button>
                </div>
              ) : (
                <motion.button
                  type="button"
                  onClick={onAddPlusOne}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "100%",
                    padding: "12px 8px",
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderStyle: "solid",
                    borderColor: "rgba(88,103,74,0.3)",
                    background: "transparent",
                    color: "#6c7261",
                    fontSize: "0.78rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Mulish', sans-serif",
                  }}
                >
                  + Add a plus one
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Getting there — transport */}
      <AnimatePresence initial={false}>
        {someoneAttending && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 28 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "22px 24px",
                background: "#eef0e6",
                border: "1px solid rgba(88,103,74,0.16)",
                borderRadius: 14,
              }}
            >
              <p
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#8a9079",
                  margin: "0 0 6px",
                }}
              >
                Getting there
              </p>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.2rem",
                  color: "#474b40",
                  margin: "0 0 4px",
                  fontWeight: 500,
                }}
              >
                Would you like transportation to the venue?
              </p>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#7d8270",
                  margin: "0 0 16px",
                  lineHeight: 1.5,
                }}
              >
                We&apos;re arranging a bus from the church to Dayra Camp — about
                90 minutes along the coast. Let us know if you&apos;d like a
                seat.
              </p>
              <motion.button
                type="button"
                onClick={() =>
                  onTransportChange(transport === true ? false : true)
                }
                whileTap={{ scale: 0.98 }}
                animate={{
                  backgroundColor: transport === true ? G : "rgba(88,103,74,0)",
                  borderColor: transport === true ? G : "rgba(88,103,74,0.3)",
                  color: transport === true ? "#f5f1e6" : "#6c7261",
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{
                  width: "100%",
                  padding: "12px 8px",
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderStyle: "solid",
                  fontSize: "0.78rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Mulish', sans-serif",
                }}
              >
                {transport === true
                  ? "✓ I'd like a seat on the bus"
                  : "I'd like a seat on the bus"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeddingRSVP;
