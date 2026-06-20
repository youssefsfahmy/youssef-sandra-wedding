import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getPartyByConfirmationCode } from "@/utils/firebase";
import type { Party } from "@/types/rsvp";

const SubmissionViewPage: React.FC = () => {
  const router = useRouter();
  const { id: confirmationCode } = router.query;

  const [party, setParty] = useState<Party | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmationCode || typeof confirmationCode !== "string") return;

    const fetchSubmission = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const partyData = await getPartyByConfirmationCode(confirmationCode);
        if (!partyData?.confirmationCode) {
          setError("RSVP submission not found. Please check your confirmation code.");
          return;
        }
        setParty(partyData);
      } catch (err) {
        console.error("Error fetching submission:", err);
        setError("Failed to load RSVP details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [confirmationCode]);

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-neutral-600">Loading your RSVP details...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-neutral-50 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center py-12">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-neutral-dark mb-4">RSVP Not Found</h1>
            <p className="text-neutral-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/form")}
              className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Submit New RSVP
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!party) return null;

  const attending = (party.guests || []).filter((g) => g.rsvp === "yes");
  const notAttending = (party.guests || []).filter((g) => g.rsvp === "no");

  return (
    <main className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-primary-dark mb-2">
              Thank You for Your RSVP!
            </h1>
            <p className="text-lg text-neutral-600 mb-4">
              We&apos;re excited to celebrate with you on Youssef & Sandra&apos;s special day!
            </p>
            <div className="bg-primary-light border border-primary-200 rounded-lg p-4 inline-block">
              <p className="text-sm text-primary-600 font-medium">
                Confirmation Code:{" "}
                <span className="font-bold text-primary-dark">{party.confirmationCode}</span>
              </p>
              <p className="text-xs text-primary-500 mt-1">
                Submitted on {formatDate(party.createdAt || 0)}
              </p>
            </div>
          </div>

          <div className="bg-secondary-light border border-secondary-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-secondary-dark mb-4">Your RSVP Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-neutral-dark">{(party.guests || []).length}</div>
                <div className="text-sm text-neutral-600">Total Guests</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary-600">{attending.length}</div>
                <div className="text-sm text-neutral-600">Attending</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-neutral-400">{notAttending.length}</div>
                <div className="text-sm text-neutral-600">Not Attending</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-dark mb-4">Guest Details</h2>
            <div className="space-y-4">
              {(party.guests || []).map((guest, index) => (
                <div key={index} className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-neutral-dark">
                      {guest.firstName} {guest.lastName}
                    </h3>
                    {guest.email && <p className="text-sm text-neutral-500">{guest.email}</p>}
                  </div>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      guest.rsvp === "yes"
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {guest.rsvp === "yes" ? "Attending" : "Not Attending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {party.message && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-primary-dark mb-2">Your Message</h2>
              <p className="text-neutral-600 italic">&ldquo;{party.message}&rdquo;</p>
            </div>
          )}

          <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-neutral-dark mb-3">Need to Make Changes?</h2>
            <p className="text-neutral-600 mb-4">
              If you need to update your RSVP or have any questions, please contact us directly.
            </p>
            <p className="text-sm text-neutral-500">
              <strong className="text-neutral-700">Youssef & Sandra</strong>
            </p>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={() => router.push("/")}
              className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Back to Event Details
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SubmissionViewPage;
