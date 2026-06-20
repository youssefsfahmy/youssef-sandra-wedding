import React from "react";
import type { Guest, GuestRSVP, YesNo } from "@/types/rsvp";

interface WeddingRSVPProps {
  guests: Guest[];
  rsvpsByGuest: Record<string, GuestRSVP>;
  onRSVPChange: (guestId: string, rsvp: YesNo) => void;
  transport?: boolean;
  onTransportChange: (value: boolean) => void;
}

const G = "#58674a";

const WeddingRSVP: React.FC<WeddingRSVPProps> = ({
  guests,
  rsvpsByGuest,
  onRSVPChange,
  transport,
  onTransportChange,
}) => {
  const someoneAttending = guests.some((g) => rsvpsByGuest[g.id]?.rsvp === "yes");

  return (
    <div>
      <p style={{ fontSize: "0.72rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#8a9079", margin: "0 0 8px" }}>
        Will you join us?
      </p>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.15rem", color: "#7d8270", margin: "0 0 32px" }}>
        Let us know if we can count on your presence.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {guests.map((guest) => {
          const rsvp = rsvpsByGuest[guest.id]?.rsvp;
          return (
            <div key={guest.id} style={{ borderBottom: "1px solid rgba(88,103,74,0.14)", paddingBottom: 20 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#474b40", margin: "0 0 14px", fontWeight: 500 }}>
                {guest.firstName} {guest.lastName}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => onRSVPChange(guest.id, "yes")}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 999,
                    border: `1.5px solid ${rsvp === "yes" ? G : "rgba(88,103,74,0.3)"}`,
                    background: rsvp === "yes" ? G : "transparent",
                    color: rsvp === "yes" ? "#f5f1e6" : "#6c7261",
                    fontSize: "0.78rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "'Mulish', sans-serif",
                  }}
                >
                  Joyfully accepts
                </button>
                <button
                  type="button"
                  onClick={() => onRSVPChange(guest.id, "no")}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 999,
                    border: `1.5px solid ${rsvp === "no" ? "#9a9a8a" : "rgba(88,103,74,0.3)"}`,
                    background: rsvp === "no" ? "#9a9a8a" : "transparent",
                    color: rsvp === "no" ? "#f5f1e6" : "#9a9a8a",
                    fontSize: "0.78rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "'Mulish', sans-serif",
                  }}
                >
                  Regretfully declines
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {someoneAttending && (
        <div style={{ marginTop: 28, padding: "22px 24px", background: "#eef0e6", border: "1px solid rgba(88,103,74,0.16)", borderRadius: 14 }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.24em", textTransform: "uppercase", color: "#8a9079", margin: "0 0 6px" }}>
            Getting there
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "#474b40", margin: "0 0 4px", fontWeight: 500 }}>
            Would you like transportation to the venue?
          </p>
          <p style={{ fontSize: "0.85rem", color: "#7d8270", margin: "0 0 16px", lineHeight: 1.5 }}>
            We&apos;re arranging a bus from the church to Dayra Camp — about 90 minutes along the coast. Let us know if you&apos;d like a seat.
          </p>
          <button
            type="button"
            onClick={() => onTransportChange(transport === true ? false : true)}
            style={{
              width: "100%",
              padding: "12px 8px",
              borderRadius: 999,
              border: `1.5px solid ${transport === true ? G : "rgba(88,103,74,0.3)"}`,
              background: transport === true ? G : "transparent",
              color: transport === true ? "#f5f1e6" : "#6c7261",
              fontSize: "0.78rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "'Mulish', sans-serif",
            }}
          >
            {transport === true ? "✓ I'd like a seat on the bus" : "I'd like a seat on the bus"}
          </button>
        </div>
      )}
    </div>
  );
};

export default WeddingRSVP;
