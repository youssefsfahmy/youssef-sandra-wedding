import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProgressBar from "@/components/ProgressBar";
import PartySearch from "@/components/PartySearch";
import WeddingRSVP from "@/components/CombinedRSVP";
import Confirmation from "@/components/Confirmation";
import { submitRSVP, getParty } from "@/utils/firebase";
import type { FormState, Party, GuestRSVP, YesNo } from "@/types/rsvp";

interface StepInfo {
  id: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

const RSVPForm: React.FC = () => {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({
    rsvpsByGuest: {},
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingParty, setIsLoadingParty] = useState(false);

  useEffect(() => {
    const loadPartyFromQuery = async () => {
      const { partyId } = router.query;
      if (partyId && typeof partyId === "string" && !formState.party) {
        setIsLoadingParty(true);
        try {
          const party = await getParty(partyId);
          if (party) {
            if (party.confirmationCode) {
              window.location.href = `/rsvp/${party.confirmationCode}`;
              return;
            } else {
              handlePartySelect(party);
              setCurrentStep(2);
            }
          } else {
            setError("Party not found. Please search for your invitation.");
          }
        } catch (error) {
          console.error("Error loading party:", error);
          setError("Failed to load party. Please try searching manually.");
        } finally {
          setIsLoadingParty(false);
        }
      }
    };

    if (router.isReady) {
      loadPartyFromQuery();
    }
  }, [router.isReady, router.query, formState.party]);

  const steps: StepInfo[] = [
    { id: 1, label: "Find Invitation", isActive: false, isCompleted: false },
    { id: 2, label: "RSVP", isActive: false, isCompleted: false },
    { id: 3, label: "Confirmation", isActive: false, isCompleted: false },
  ];

  const getCurrentSteps = (): StepInfo[] =>
    steps.map((step) => ({
      ...step,
      isActive: step.id === currentStep,
      isCompleted: step.id < currentStep || (step.id <= currentStep && isStepValid(step.id)),
    }));

  const isStepValid = (stepId: number): boolean => {
    switch (stepId) {
      case 1:
        return !!formState.party;
      case 2:
        if (!formState.party) return true;
        return formState.party.members.every(
          (member) => formState.rsvpsByGuest[member.id]?.rsvp !== undefined
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handlePartySelect = (party: Party) => {
    setFormState((prev) => ({
      ...prev,
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
    }));
    setError(null);
  };

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
    } catch (error) {
      console.error("Submission error:", error);
      setError("Failed to submit RSVP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWhatsappNotification = async (
    formState: FormState,
    confirmationCode: string
  ) => {
    const names = formState.party?.members.map(
      (m) => `${m.firstName} ${m.lastName}`
    );
    const link = "https://youssefxsandra.com/rsvp/" + confirmationCode;
    const encodedText = encodeURIComponent(
      names
        ? "New Submission from " + names.join(", ") + "\n" + link
        : "New submission " + link
    );
    try {
      await fetch(`/api/send-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: encodedText }),
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep === 1 && formState.party?.confirmationCode) {
      window.location.href = `/rsvp/${formState.party.confirmationCode}`;
      return;
    }
    if (canGoNext) setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (currentStep === 1) {
      window.location.href = "/";
      return;
    }
    if (currentStep === 2) {
      const { partyId } = router.query;
      if (partyId && typeof partyId === "string") {
        window.location.href = "/";
      } else {
        setFormState((prev) => ({ ...prev, rsvpsByGuest: {}, party: undefined }));
        setError(null);
        setCurrentStep(1);
      }
      return;
    }
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canGoNext = isStepValid(currentStep) && currentStep < getCurrentSteps().length;
  const canGoBack =
    currentStep === 1 ||
    (currentStep > 1 && !formState.confirmationCode && !formState.party?.confirmationCode);

  const renderCurrentStep = () => {
    if (isLoadingParty) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your invitation...</p>
        </div>
      );
    }

    if (!formState.party) {
      return (
        <PartySearch
          onPartySelect={handlePartySelect}
          selectedParty={formState.party}
        />
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <PartySearch
            onPartySelect={handlePartySelect}
            selectedParty={formState.party}
          />
        );
      case 2:
        return (
          <WeddingRSVP
            guests={formState.party.members}
            rsvpsByGuest={formState.rsvpsByGuest}
            onRSVPChange={handleRSVPChange}
          />
        );
      default:
        return (
          <Confirmation
            party={formState.party}
            guests={formState.party.members}
            rsvpsByGuest={formState.rsvpsByGuest}
            confirmationCode={
              formState.confirmationCode || formState.party.confirmationCode
            }
            isSubmitted={!!formState.confirmationCode}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            handleMessageChange={handleMessageChange}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <div className="max-w-2xl mx-auto px-2">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-neutral-300">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-dark mb-2">
              Wedding RSVP
            </h1>
            <p className="text-neutral-600">
              Please complete the form below to confirm your attendance
            </p>
          </div>

          <ProgressBar steps={getCurrentSteps()} />

          {error && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-primary font-medium">{error}</p>
            </div>
          )}

          <div className="mb-8">
            <div className="transition-all duration-300 ease-in-out">
              {renderCurrentStep()}
            </div>
          </div>

          {!formState.confirmationCode && (
            <div className="flex justify-between pt-6 border-t border-neutral-300">
              <button
                onClick={handleBack}
                disabled={!canGoBack}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  canGoBack
                    ? "bg-primary-100 text-primary hover:bg-neutral-200"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                }`}
              >
                ← Back
              </button>

              {currentStep < getCurrentSteps().length ? (
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    canGoNext
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
