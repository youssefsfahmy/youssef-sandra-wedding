import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
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

const RSVPForm: React.FC = () => {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({ rsvpsByGuest: {} });
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingParty, setIsLoadingParty] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const { partyId } = router.query;
    if (!partyId || typeof partyId !== "string") {
      window.location.href = "/";
      return;
    }

    getParty(partyId).then((party) => {
      if (!party) {
        window.location.href = "/";
        return;
      }
      if (party.confirmationCode) {
        window.location.href = `/rsvp/${party.confirmationCode}`;
        return;
      }
      setFormState({
        party,
        rsvpsByGuest: party.members.reduce((acc, member) => {
          acc[member.id] = {
            guestId: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email || "",
          };
          return acc;
        }, {} as Record<string, GuestRSVP>),
      });
      setIsLoadingParty(false);
    }).catch(() => {
      window.location.href = "/";
    });
  }, [router.isReady, router.query]);

  const isStep1Valid = formState.party
    ? formState.party.members.every(
        (m) => formState.rsvpsByGuest[m.id]?.rsvp !== undefined
      )
    : false;

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

  const handleSubmit = async () => {
    if (!formState.party) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const confirmationCode = await submitRSVP(
        formState.party.id,
        formState.party.label,
        formState.rsvpsByGuest,
        formState.party.message || ""
      );
      sendWhatsappNotification(formState, confirmationCode);
      setFormState((prev) => ({ ...prev, confirmationCode }));
    } catch {
      setError("Failed to submit RSVP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWhatsappNotification = async (state: FormState, confirmationCode: string) => {
    const names = state.party?.members.map((m) => `${m.firstName} ${m.lastName}`);
    const link = "https://youssefxsandra.com/rsvp/" + confirmationCode;
    const encodedText = encodeURIComponent(
      names ? "New Submission from " + names.join(", ") + "\n" + link : "New submission " + link
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

  if (isLoadingParty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-neutral-600">Loading your invitation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <div className="max-w-2xl mx-auto px-2">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-neutral-300">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-dark mb-2">Wedding RSVP</h1>
            <p className="text-neutral-600">Please confirm your attendance below</p>
          </div>

          <ProgressBar steps={getCurrentSteps()} />

          {error && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-primary font-medium">{error}</p>
            </div>
          )}

          <div className="mb-8">
            {currentStep === 1 && formState.party && (
              <WeddingRSVP
                guests={formState.party.members}
                rsvpsByGuest={formState.rsvpsByGuest}
                onRSVPChange={handleRSVPChange}
              />
            )}
            {currentStep === 2 && formState.party && (
              <Confirmation
                party={formState.party}
                guests={formState.party.members}
                rsvpsByGuest={formState.rsvpsByGuest}
                confirmationCode={formState.confirmationCode || formState.party.confirmationCode}
                isSubmitted={!!formState.confirmationCode}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                handleMessageChange={handleMessageChange}
              />
            )}
          </div>

          {!formState.confirmationCode && (
            <div className="flex justify-between pt-6 border-t border-neutral-300">
              <button
                onClick={() => {
                  if (currentStep === 1) { window.location.href = "/"; return; }
                  setCurrentStep(currentStep - 1);
                }}
                className="px-6 py-2 rounded-lg font-medium bg-primary-100 text-primary hover:bg-neutral-200 transition-all"
              >
                ← Back
              </button>

              {currentStep < STEPS.length ? (
                <button
                  onClick={() => { if (isStep1Valid) setCurrentStep(2); }}
                  disabled={!isStep1Valid}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    isStep1Valid
                      ? "bg-primary text-white hover:bg-accent-hover shadow-lg"
                      : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Next →
                </button>
              ) : (
                <div />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RSVPForm;
