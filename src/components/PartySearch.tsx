import React, { useState } from "react";
import { searchParties } from "@/utils/firebase";
import type { Party } from "@/types/rsvp";

interface Step1PartySearchProps {
  onPartySelect: (party: Party) => void;
  selectedParty?: Party;
}
const Step1PartySearch: React.FC<Step1PartySearchProps> = ({
  onPartySelect,
  selectedParty,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchParties(searchTerm);
      console.log("Search results:", results);

      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        window.scrollTo({ top: 350, behavior: "smooth" });
      }, 200);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    //scroll the input field to the top of the page on mobile when focused
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handlePartySelect = (party: Party) => {
    onPartySelect(party);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Find Your Invitation
        </h3>
        <p className="text-gray-600 mb-4">
          Enter your name or the name of someone in your group to find your
          invitation.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          style={{
            scrollMarginTop: "80px",
          }}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (hasSearched) {
              setHasSearched(false);
              setSearchResults([]);
            }
          }}
          onKeyPress={handleKeyPress}
          onFocus={handleInputFocus}
          placeholder="Enter your name..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:border-transparent focus:ring-2 focus:ring-primary-50"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !searchTerm.trim()}
          className={`flex-1 px-3 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            isLoading || !searchTerm.trim()
              ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary-dark shadow-lg"
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Search
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search
            </>
          )}
        </button>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-3">
          {searchResults.length > 0 ? (
            <>
              <h4 className="font-medium text-gray-900">
                Found {searchResults.length} invitation
                {searchResults.length > 1 ? "s" : ""}:
              </h4>
              {searchResults.map((party) => (
                <div
                  key={party.id}
                  onClick={() => handlePartySelect(party)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedParty?.id === party.id
                      ? "border-primary bg-primary-100"
                      : "border-gray-200 hover:border-primary-50 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      {party.partyLabel && (
                        <h5 className="font-medium text-gray-900 mb-1">
                          {party.partyLabel}
                        </h5>
                      )}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Guests: </span>
                        {party.members
                          .map(
                            (member) =>
                              `${member.firstName} ${member.lastName}`,
                          )
                          .join(", ")}
                      </div>
                      {/* <div className="text-xs text-gray-500 mt-2">
                        {party.invitedToPrayer &&
                          party.invitedToParty &&
                          "Invited to Prayer Ceremony & Party"}
                        {party.invitedToPrayer &&
                          !party.invitedToParty &&
                          "Invited to Prayer Ceremony"}
                        {!party.invitedToPrayer &&
                          party.invitedToParty &&
                          "Invited to Party"}
                      </div> */}
                    </div>
                    {selectedParty?.id === party.id && (
                      <div className="text-primary">
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-gray-600">
                No invitations found. Please check your spelling or try a
                different name.
              </p>
            </div>
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-8 text-gray-500">
          <p>
            Enter your name above and click &quot;Search&quot; to find your
            invitation.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step1PartySearch;
