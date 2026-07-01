import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Party } from "@/types/rsvp";

interface PartyWithSubmission extends Party {
  hasSubmission: boolean;
  submissionDate?: string;
  transport?: boolean;
}

const ViewPage: React.FC = () => {
  const [parties, setParties] = useState<PartyWithSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<"parties" | "submissions" | "totals">("totals");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPartyId, setCopiedPartyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "submitted" | "pending">("all");
  const [invitationFilter, setInvitationFilter] = useState<"all" | "sent" | "not-sent">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const copyPartyLink = async (party: PartyWithSubmission) => {
    const link = `https://youssefxsandra.com?partyId=${party.id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedPartyId(party.id);
    setTimeout(() => setCopiedPartyId(null), 2000);
  };

  const fetchParties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, "parties"));
      const data: PartyWithSubmission[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          label: d.label || "",
          members: d.members || [],
          partyLabel: d.partyLabel,
          confirmationCode: d.confirmationCode,
          createdAt: d.createdAt,
          guests: d.guests || [],
          message: d.message || "",
          hasSubmission: !!d.confirmationCode,
          submissionDate: d.createdAt ? new Date(d.createdAt).toLocaleString() : undefined,
          transport: d.transport,
          invitationSent: !!d.invitationSent,
        };
      });
      setParties(data);
    } catch (err) {
      setError(`Failed to fetch parties: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInvitationSent = async (party: PartyWithSubmission) => {
    const next = !party.invitationSent;
    setUpdatingId(party.id);
    setError(null);
    try {
      await updateDoc(doc(db, "parties", party.id), { invitationSent: next });
      setParties((prev) =>
        prev.map((p) => (p.id === party.id ? { ...p, invitationSent: next } : p)),
      );
    } catch (err) {
      setError(`Failed to update party: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteParty = async (party: PartyWithSubmission) => {
    const name = party.label || party.partyLabel || party.id;
    if (
      !window.confirm(
        `Delete "${name}"? This permanently removes the party and any RSVP it submitted. This cannot be undone.`,
      )
    )
      return;
    setDeletingId(party.id);
    setError(null);
    try {
      await deleteDoc(doc(db, "parties", party.id));
      setParties((prev) => prev.filter((p) => p.id !== party.id));
    } catch (err) {
      setError(`Failed to delete party: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [activeTab]);

  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

  const getOverallTotals = () => {
    const submitted = parties.filter((p) => p.hasSubmission);
    const allMembers = parties.flatMap((p) => p.members);
    const allGuests = submitted.flatMap((p) => p.guests || []);

    const attending = allGuests.filter((g) => g.rsvp === "yes").length;
    const notAttending = allGuests.filter((g) => g.rsvp === "no").length;

    const needsCoach = submitted.filter((p) => p.transport === true).length;
    const invitationsSent = parties.filter((p) => p.invitationSent).length;

    return {
      totalParties: parties.length,
      submittedParties: submitted.length,
      totalMembers: allMembers.length,
      totalGuests: allGuests.length,
      attending,
      notAttending,
      needsCoach,
      invitationsSent,
      responseRate: parties.length > 0
        ? ((submitted.length / parties.length) * 100).toFixed(1)
        : "0",
    };
  };

  const getFilteredParties = () => {
    let filtered = parties;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((p) =>
        (p.label?.toLowerCase() || "").includes(q) ||
        p.members.some((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q))
      );
    }

    if (submissionFilter === "submitted") filtered = filtered.filter((p) => p.hasSubmission);
    if (submissionFilter === "pending") filtered = filtered.filter((p) => !p.hasSubmission);

    if (invitationFilter === "sent") filtered = filtered.filter((p) => p.invitationSent);
    if (invitationFilter === "not-sent") filtered = filtered.filter((p) => !p.invitationSent);

    return filtered.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
  };

  const exportToCSV = () => {
    const rows = [
      ["Party ID", "Party Label", "First Name", "Last Name", "Email", "RSVP Submitted", "Confirmation Code", "Submission Date", "RSVP"],
    ];

    parties.forEach((party) => {
      party.members.forEach((member) => {
        const guestRSVP = party.guests?.find(
          (g) => g.firstName === member.firstName && g.lastName === member.lastName
        );
        rows.push([
          party.id,
          party.label || "",
          member.firstName,
          member.lastName,
          member.email || "",
          party.hasSubmission ? "Yes" : "No",
          party.confirmationCode || "",
          party.submissionDate || "",
          guestRSVP?.rsvp || "",
        ]);
      });
    });

    const csv = rows.map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `wedding-rsvp-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Wedding RSVP Dashboard</h1>
            <p className="text-gray-600">View all invitations and RSVP submissions</p>
          </div>

          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex">
              {(["parties", "submissions", "totals"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-4 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? "border-primary-1000 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab === "parties" && `All Parties (${parties.length})`}
                  {tab === "submissions" && `Submitted (${parties.filter((p) => p.hasSubmission).length})`}
                  {tab === "totals" && "Totals & Stats"}
                </button>
              ))}
            </nav>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-1000"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          )}

          {/* Parties Tab */}
          {activeTab === "parties" && !isLoading && (
            <div className="space-y-6">
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-neutral-dark">Filter Parties</h3>
                  <button
                    onClick={exportToCSV}
                    className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Search by Name</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Party or member name..."
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">RSVP Status</label>
                    <select
                      value={submissionFilter}
                      onChange={(e) => setSubmissionFilter(e.target.value as typeof submissionFilter)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                    >
                      <option value="all">All Parties</option>
                      <option value="submitted">Submitted</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Invitation</label>
                    <select
                      value={invitationFilter}
                      onChange={(e) => setInvitationFilter(e.target.value as typeof invitationFilter)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                    >
                      <option value="all">All</option>
                      <option value="sent">Invitation sent</option>
                      <option value="not-sent">Not sent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                {(() => {
                  const filtered = getFilteredParties();
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <p className="text-gray-600">
                          {parties.length === 0 ? "No parties found." : "No parties match the current filters."}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="mb-4 text-sm text-neutral-600">
                        Showing {filtered.length} of {parties.length} parties
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((party) => (
                          <div key={party.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="mb-3">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-gray-900">{party.label}</h3>
                                {party.invitationSent && (
                                  <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                    ✉ Invited
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">ID: {party.id}</p>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Members:</span> {party.members.length}
                                <div className="text-xs text-gray-600 mt-1">
                                  {party.members.map((m) => `${m.firstName} ${m.lastName}`).join(", ")}
                                </div>
                              </div>

                              <div className="flex justify-between text-xs text-gray-600">
                                <span>{party.members.length} guests</span>
                                <span>
                                  {party.hasSubmission ? (
                                    <span className="text-green-600">✓ Submitted</span>
                                  ) : (
                                    <span className="text-gray-400">No submission</span>
                                  )}
                                </span>
                              </div>

                              {party.hasSubmission && (
                                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                                  <div>Code: {party.confirmationCode}</div>
                                  <div>Submitted: {party.submissionDate}</div>
                                  <div>
                                    Attending:{" "}
                                    {party.guests?.filter((g) => g.rsvp === "yes").length || 0} /{" "}
                                    {party.guests?.length || 0}
                                  </div>
                                </div>
                              )}

                              <div className="mt-3 pt-2 border-t border-gray-100 space-y-2">
                                <button
                                  onClick={() => copyPartyLink(party)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 rounded-lg transition-colors"
                                >
                                  {copiedPartyId === party.id ? "✓ Link Copied!" : "Copy RSVP Link"}
                                </button>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => toggleInvitationSent(party)}
                                    disabled={updatingId === party.id}
                                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg border transition-colors disabled:opacity-50 ${
                                      party.invitationSent
                                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                        : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
                                    }`}
                                  >
                                    {updatingId === party.id
                                      ? "Saving…"
                                      : party.invitationSent
                                        ? "✓ Invitation sent"
                                        : "Mark invited"}
                                  </button>
                                  <button
                                    onClick={() => deleteParty(party)}
                                    disabled={deletingId === party.id}
                                    className="flex items-center justify-center gap-1 px-3 py-2 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    {deletingId === party.id ? "Deleting…" : "Delete"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === "submissions" && !isLoading && (
            <div className="space-y-4">
              {parties.filter((p) => p.hasSubmission).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No RSVP submissions found.</p>
                </div>
              ) : (
                parties
                  .filter((p) => p.hasSubmission)
                  .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                  .map((party) => {
                    const attending = (party.guests || []).filter((g) => g.rsvp === "yes").length;
                    const notAttending = (party.guests || []).filter((g) => g.rsvp === "no").length;

                    return (
                      <div key={party.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Confirmation: {party.confirmationCode}
                            </h3>
                            <p className="text-sm text-gray-600">{party.label}</p>
                            <p className="text-xs text-gray-500">
                              Submitted: {formatDate(party.createdAt || 0)}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">{(party.guests || []).length} guests</div>
                            <div className="text-green-600">{attending} attending</div>
                            <div className="text-gray-400">{notAttending} not attending</div>
                            {party.transport === true && (
                              <div className="text-blue-600">🚌 Bus requested</div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(party.guests || []).map((guest, i) => (
                            <div key={i} className="bg-gray-50 rounded p-3 flex justify-between items-center">
                              <div>
                                <span className="font-medium text-gray-900">
                                  {guest.firstName} {guest.lastName}
                                </span>
                                {guest.email && (
                                  <span className="text-sm text-gray-500 ml-2">({guest.email})</span>
                                )}
                              </div>
                              <span
                                className={`text-sm font-medium px-2 py-1 rounded-full ${
                                  guest.rsvp === "yes"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {guest.rsvp === "yes" ? "Attending" : "Not Attending"}
                              </span>
                            </div>
                          ))}
                        </div>

                        {party.message && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <span className="text-sm font-medium text-gray-700">Message: </span>
                            <span className="text-sm text-gray-600 italic">&ldquo;{party.message}&rdquo;</span>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {/* Totals Tab */}
          {activeTab === "totals" && !isLoading && (
            <div className="space-y-6">
              {(() => {
                const totals = getOverallTotals();
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-primary-light border border-primary-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary-dark">{totals.totalParties}</div>
                        <div className="text-sm text-primary-600">Total Parties</div>
                      </div>
                      <div className="bg-secondary-light border border-secondary-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-secondary-dark">{totals.submittedParties}</div>
                        <div className="text-sm text-secondary-600">Submitted RSVPs</div>
                      </div>
                      <div className="bg-accent-light border border-accent-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-accent-dark">{totals.totalMembers}</div>
                        <div className="text-sm text-accent-600">Total Invited</div>
                      </div>
                      <div className="bg-neutral-light border border-neutral-300 rounded-lg p-4">
                        <div className="text-2xl font-bold text-neutral-dark">{totals.responseRate}%</div>
                        <div className="text-sm text-neutral-600">Response Rate</div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-neutral-dark mb-4">Attendance</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{totals.attending}</div>
                          <div className="text-sm text-neutral-600">Attending</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-neutral-400">{totals.notAttending}</div>
                          <div className="text-sm text-neutral-600">Not Attending</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-neutral-500">
                            {totals.totalMembers - totals.attending - totals.notAttending}
                          </div>
                          <div className="text-sm text-neutral-600">No Response</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{totals.needsCoach}</div>
                          <div className="text-sm text-neutral-600">Bus seats requested</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-neutral-dark mb-4">Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total parties:</span>
                          <span className="font-medium">{totals.totalParties}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Invitations sent:</span>
                          <span className="font-medium text-emerald-600">{totals.invitationsSent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Responses received:</span>
                          <span className="font-medium text-secondary-600">{totals.submittedParties}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending responses:</span>
                          <span className="font-medium text-neutral-500">
                            {totals.totalParties - totals.submittedParties}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ViewPage;
