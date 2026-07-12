import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "motion/react";
import ProgressBar from "@/components/ProgressBar";
import WeddingRSVP from "@/components/CombinedRSVP";
import Confirmation from "@/components/Confirmation";
import { submitRSVP, getParty } from "@/utils/firebase";
import type { FormState, GuestRSVP, YesNo } from "@/types/rsvp";

interface StepInfo {
  id: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

const STEPS: StepInfo[] = [
  { id: 1, label: "RSVP", isActive: false, isCompleted: false },
  { id: 2, label: "Confirmation", isActive: false, isCompleted: false },
];

const PLUS_ONE_ID = "plus-one";

const RSVPForm: React.FC = () => {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({ rsvpsByGuest: {} });
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingParty, setIsLoadingParty] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const { partyId, edit } = router.query;
    if (!partyId || typeof partyId !== "string") {
      window.location.href = "/";
      return;
    }

    getParty(partyId)
      .then((party) => {
        if (!party) {
          window.location.href = "/";
          return;
        }
        // If already submitted and not in edit mode, redirect to confirmation
        if (party.confirmationCode && edit !== "true") {
          window.location.href = `/rsvp/${party.confirmationCode}`;
          return;
        }
        // Load existing data (for new or edit)
        const rsvpsByGuest: Record<string, GuestRSVP> = {};

        // Start with party members
        party.members.forEach((member) => {
          rsvpsByGuest[member.id] = {
            guestId: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email || "",
          };
        });

        // If editing, overlay existing RSVP responses
        if (party.guests) {
          party.guests.forEach((guest) => {
            if (guest.isPlusOne) {
              // Plus one
              rsvpsByGuest[PLUS_ONE_ID] = guest;
            } else {
              // Find matching member
              const member = party.members.find(
                (m) =>
                  m.firstName === guest.firstName &&
                  m.lastName === guest.lastName,
              );
              if (member) {
                rsvpsByGuest[member.id] = {
                  ...rsvpsByGuest[member.id],
                  ...guest,
                };
              }
            }
          });
        }

        setFormState({
          party,
          rsvpsByGuest,
          transport: party.transport,
        });
        setIsLoadingParty(false);
      })
      .catch(() => {
        window.location.href = "/";
      });
  }, [router.isReady, router.query]);

  const plusOne = formState.rsvpsByGuest[PLUS_ONE_ID];

  const isStep1Valid = formState.party
    ? formState.party.members.every(
        (m) => formState.rsvpsByGuest[m.id]?.rsvp !== undefined,
      ) &&
      (!plusOne || plusOne.firstName.trim().length > 0)
    : false;

  const handleAddPlusOne = () => {
    setFormState((prev) => ({
      ...prev,
      rsvpsByGuest: {
        ...prev.rsvpsByGuest,
        [PLUS_ONE_ID]: {
          guestId: PLUS_ONE_ID,
          firstName: "",
          lastName: "",
          rsvp: "yes",
          isPlusOne: true,
        },
      },
    }));
  };

  const handleRemovePlusOne = () => {
    setFormState((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [PLUS_ONE_ID]: _removed, ...rest } = prev.rsvpsByGuest;
      return { ...prev, rsvpsByGuest: rest };
    });
  };

  const handlePlusOneNameChange = (name: string) => {
    setFormState((prev) => {
      const current = prev.rsvpsByGuest[PLUS_ONE_ID];
      if (!current) return prev;
      return {
        ...prev,
        rsvpsByGuest: {
          ...prev.rsvpsByGuest,
          [PLUS_ONE_ID]: { ...current, firstName: name },
        },
      };
    });
  };

  const getCurrentSteps = (): StepInfo[] =>
    STEPS.map((step) => ({
      ...step,
      isActive: step.id === currentStep,
      isCompleted: step.id < currentStep || (step.id === 1 && isStep1Valid),
    }));

  const handleRSVPChange = (guestId: string, rsvp: YesNo) => {
    setFormState((prev) => ({
      ...prev,
      rsvpsByGuest: {
        ...prev.rsvpsByGuest,
        [guestId]: { ...prev.rsvpsByGuest[guestId], rsvp },
      },
    }));
  };

  const handleMessageChange = (message: string) => {
    setFormState((prev) => ({
      ...prev,
      party: prev.party ? { ...prev.party, message } : prev.party,
    }));
  };

  const handleTransportChange = (value: boolean) => {
    setFormState((prev) => ({ ...prev, transport: value }));
  };

  const handleSubmit = async () => {
    if (!formState.party) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const confirmationCode = await submitRSVP(
        formState.party.id,
        formState.party.label,
        formState.rsvpsByGuest,
        formState.party.message || "",
        formState.transport,
      );
      sendWhatsappNotification(formState, confirmationCode);
      setFormState((prev) => ({ ...prev, confirmationCode }));
    } catch {
      setError("Failed to submit RSVP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWhatsappNotification = async (
    state: FormState,
    confirmationCode: string,
  ) => {
    const names = state.party?.members.map(
      (m) => `${m.firstName} ${m.lastName}`,
    );
    const plusOneGuest = state.rsvpsByGuest[PLUS_ONE_ID];
    if (names && plusOneGuest?.firstName.trim()) {
      names.push(`${plusOneGuest.firstName} (+1)`);
    }
    const link = "https://youssefxsandra.com/rsvp/" + confirmationCode;
    const encodedText = encodeURIComponent(
      names
        ? "New Submission from " + names.join(", ") + "\n" + link
        : "New submission " + link,
    );
    try {
      await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: encodedText }),
      });
    } catch {}
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

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

  if (isLoadingParty) {
    return (
      <div style={pageStyle}>
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "1.2rem",
            color: "#7d8270",
          }}
        >
          Preparing your invitation…
        </p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a
            href="/"
            style={{
              fontFamily: "'Tangerine', cursive",
              fontSize: "1.7rem",
              color: "#58674a",
              textDecoration: "none",
              display: "block",
              marginBottom: 20,
            }}
          >
            Y &amp; S
          </a>
        </div>

        <ProgressBar steps={getCurrentSteps()} />

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              background: "rgba(88,103,74,0.08)",
              border: "1px solid rgba(88,103,74,0.2)",
              borderRadius: 10,
            }}
          >
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#58674a" }}>
              {error}
            </p>
          </div>
        )}

        <div className="mb-8">
          <AnimatePresence mode="wait" initial={false}>
            {currentStep === 1 && formState.party && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <WeddingRSVP
                  guests={formState.party.members}
                  rsvpsByGuest={formState.rsvpsByGuest}
                  onRSVPChange={handleRSVPChange}
                  transport={formState.transport}
                  onTransportChange={handleTransportChange}
                  allowPlusOne={!!formState.party.allowPlusOne}
                  plusOne={plusOne}
                  onAddPlusOne={handleAddPlusOne}
                  onRemovePlusOne={handleRemovePlusOne}
                  onPlusOneNameChange={handlePlusOneNameChange}
                />
              </motion.div>
            )}
            {currentStep === 2 && formState.party && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <Confirmation
                  party={formState.party}
                  guests={formState.party.members}
                  rsvpsByGuest={formState.rsvpsByGuest}
                  confirmationCode={formState.confirmationCode}
                  isSubmitted={!!formState.confirmationCode}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  handleMessageChange={handleMessageChange}
                  transport={formState.transport}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!formState.confirmationCode && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 24,
              borderTop: "1px solid rgba(88,103,74,0.14)",
              marginTop: 8,
            }}
          >
            <button
              onClick={() => {
                if (currentStep === 1) {
                  window.location.href = "/";
                  return;
                }
                setCurrentStep(currentStep - 1);
              }}
              style={{
                background: "transparent",
                border: "1px solid rgba(88,103,74,0.3)",
                color: "#6c7261",
                padding: "10px 22px",
                borderRadius: 999,
                fontSize: "0.76rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ← Back
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={() => {
                  if (isStep1Valid) setCurrentStep(2);
                }}
                disabled={!isStep1Valid}
                style={{
                  background: isStep1Valid ? "#58674a" : "rgba(88,103,74,0.2)",
                  color: isStep1Valid ? "#f5f1e6" : "#9a9a8a",
                  border: "none",
                  padding: "10px 28px",
                  borderRadius: 999,
                  fontSize: "0.76rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  cursor: isStep1Valid ? "pointer" : "not-allowed",
                }}
              >
                Continue →
              </button>
            ) : (
              <div />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RSVPForm;
