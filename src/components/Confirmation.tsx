import React from "react";
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
}

const Confirmation: React.FC<ConfirmationProps> = ({
  party,
  guests,
  rsvpsByGuest,
  confirmationCode,
  onSubmit,
  isSubmitting,
  handleMessageChange,
}) => {
  const router = useRouter();

  if (confirmationCode) {
    return (
      <div className="text-center space-y-6">
        <div className="text-primary mb-4">
          <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-secondary-dark mb-2">
            RSVP Submitted Successfully!
          </h3>
          <p className="text-neutral-600 mb-6">
            Thank you for your response. We look forward to celebrating with you!
          </p>
        </div>

        <div className="text-sm text-neutral-600">
          <p>If you need to make changes to your RSVP, please contact us directly.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <button
            onClick={() => router.push("/")}
            className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Back to Event Details
          </button>
        </div>
      </div>
    );
  }

  const attending = guests.filter((g) => rsvpsByGuest[g.id]?.rsvp === "yes");
  const notAttending = guests.filter((g) => rsvpsByGuest[g.id]?.rsvp === "no");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-reseda-green mb-2">Confirm Your RSVP</h3>
        <p className="text-ash-gray mb-4">Please review your responses before submitting.</p>
      </div>

      <div className="bg-linen rounded-lg p-4 border border-timberwolf">
        <h4 className="font-medium text-reseda-green mb-2">Party Details</h4>
        {party.label && (
          <p className="text-sm text-ash-gray mb-1">
            <span className="font-medium">Party:</span> {party.label}
          </p>
        )}
        <p className="text-sm text-ash-gray">
          <span className="font-medium">Guests:</span>{" "}
          {guests.map((g) => `${g.firstName} ${g.lastName}`).join(", ")}
        </p>
      </div>

      {attending.length > 0 && (
        <div className="border border-timberwolf rounded-lg p-4 bg-white">
          <h4 className="font-medium text-reseda-green mb-3">Attending</h4>
          <p className="text-reseda-green font-medium mb-2">
            ✓ {attending.length} guest{attending.length > 1 ? "s" : ""} attending
          </p>
          <ul className="text-sm text-ash-gray space-y-1">
            {attending.map((g) => (
              <li key={g.id}>• {g.firstName} {g.lastName}</li>
            ))}
          </ul>
        </div>
      )}

      {notAttending.length > 0 && (
        <div className="border border-timberwolf rounded-lg p-4 bg-white">
          <h4 className="font-medium text-ash-gray mb-3">Not Attending</h4>
          <ul className="text-sm text-ash-gray space-y-1">
            {notAttending.map((g) => (
              <li key={g.id}>• {g.firstName} {g.lastName}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="border border-brown-sugar/30 rounded-lg p-4 bg-primary-50">
        <h4 className="font-medium text-brown-sugar mb-3">
          Leave a message for Youssef & Sandra
        </h4>
        <p className="text-sm text-reseda-green mb-4">
          Share your congratulations, well wishes, or a favorite memory!
        </p>
        <textarea
          placeholder="Write your message here... (Optional)"
          rows={4}
          className="w-full px-3 py-2 border border-timberwolf rounded-lg focus:ring-2 focus:ring-brown-sugar focus:border-transparent resize-none placeholder-ash-gray"
          onChange={(e) => handleMessageChange(e.target.value)}
        />
        <p className="text-xs text-reseda-green mt-2">
          ✨ Your message will be shared with Youssef and Sandra
        </p>
      </div>

      <div className="pt-4">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary-500 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Submitting RSVP...
            </span>
          ) : (
            "Submit RSVP"
          )}
        </button>
      </div>
    </div>
  );
};

export default Confirmation;
