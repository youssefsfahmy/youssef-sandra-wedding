import React, { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Member {
  firstName: string;
  lastName: string;
}

interface MemberWithId extends Member {
  id: string;
}

interface PartyData {
  label: string;
  partyLabel?: string;
  members: MemberWithId[];
  searchIndex: string[];
  allowPlusOne?: boolean;
}

interface FormState {
  partyId: string;
  labelTemplate: string;
  partyLabel: string;
  members: Member[];
  allowPlusOne: boolean;
}

const LABEL_TEMPLATES = ["Sandra's family", "Youssef's family", "Friends"];

const tokenize = (str: string): string[] =>
  str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((token) => token.length > 0);

const buildSearchIndex = (members: Member[]): string[] => {
  const tokens = new Set<string>();
  members.forEach((member) => {
    tokenize(member.firstName).forEach((t) => tokens.add(t));
    tokenize(member.lastName).forEach((t) => tokens.add(t));
  });
  return Array.from(tokens);
};

const generateMemberIds = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `g-${String(i + 1).padStart(3, "0")}`);

const PartyCreator: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    partyId: `pty-${Math.random().toString(36).substring(2, 8)}`,
    labelTemplate: LABEL_TEMPLATES[0],
    partyLabel: "",
    members: [{ firstName: "", lastName: "" }],
    allowPlusOne: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const updateFormState = (updates: Partial<FormState>) =>
    setFormState((prev) => ({ ...prev, ...updates }));

  const addMember = () =>
    setFormState((prev) => ({
      ...prev,
      members: [...prev.members, { firstName: "", lastName: "" }],
    }));

  const removeMember = (index: number) => {
    if (formState.members.length > 1) {
      setFormState((prev) => ({
        ...prev,
        members: prev.members.filter((_, i) => i !== index),
      }));
    }
  };

  const updateMember = (index: number, field: keyof Member, value: string) =>
    setFormState((prev) => ({
      ...prev,
      members: prev.members.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));

  const resetForm = () => {
    setFormState({
      partyId: `pty-${Math.random().toString(36).substring(2, 8)}`,
      labelTemplate: LABEL_TEMPLATES[0],
      partyLabel: "",
      members: [{ firstName: "", lastName: "" }],
      allowPlusOne: false,
    });
    setMessage(null);
  };

  const validateForm = (): string | null => {
    if (!formState.partyId.trim()) return "Party ID is required";
    const valid = formState.members.filter((m) => m.firstName.trim());
    if (valid.length === 0) return "At least one member with a first name is required";
    return null;
  };

  const saveParty = async () => {
    const validation = validateForm();
    if (validation) {
      setMessage({ type: "error", text: validation });
      return;
    }

    setIsSubmitting(true);
    try {
      const validMembers = formState.members.filter((m) => m.firstName.trim());
      const memberIds = generateMemberIds(validMembers.length);
      const membersWithIds: MemberWithId[] = validMembers.map((m, i) => ({
        id: memberIds[i],
        firstName: m.firstName.trim(),
        lastName: m.lastName.trim(),
      }));

      const partyData: PartyData = {
        label: formState.labelTemplate,
        ...(formState.partyLabel.trim() && { partyLabel: formState.partyLabel.trim() }),
        members: membersWithIds,
        searchIndex: buildSearchIndex(validMembers),
        allowPlusOne: formState.allowPlusOne,
      };

      await setDoc(doc(db, "parties", formState.partyId), partyData, { merge: true });
      setMessage({ type: "success", text: `Party saved: ${formState.partyId}` });
      setFormState((prev) => ({
        ...prev,
        partyId: `pty-${Math.random().toString(36).substring(2, 8)}`,
      }));
    } catch (error) {
      console.error("Error saving party:", error);
      setMessage({
        type: "error",
        text: `Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Party</h1>
            <p className="text-gray-600">Create a new party for the wedding guest list</p>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {/* Party ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Party ID *</label>
              <input
                type="text"
                value={formState.partyId}
                onChange={(e) => updateFormState({ partyId: e.target.value })}
                placeholder="e.g., pty-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Internal Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Internal Label *</label>
              <select
                value={formState.labelTemplate}
                onChange={(e) => updateFormState({ labelTemplate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {LABEL_TEMPLATES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Party Label (shown to guests) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Party Label <span className="text-gray-400 font-normal">(shown to guests, optional)</span>
              </label>
              <input
                type="text"
                value={formState.partyLabel}
                onChange={(e) => updateFormState({ partyLabel: e.target.value })}
                placeholder="e.g., The Fahmy Family"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Allow plus one */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.allowPlusOne}
                  onChange={(e) =>
                    updateFormState({ allowPlusOne: e.target.checked })
                  }
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-700">
                    Allow a plus one
                  </span>
                  <span className="block text-xs text-gray-400">
                    Lets this party add one extra guest when they RSVP.
                  </span>
                </span>
              </label>
            </div>

            {/* Members */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">Party Members *</label>
                <button
                  type="button"
                  onClick={addMember}
                  className="px-3 py-1 text-sm bg-primary-100 text-primary rounded hover:bg-primary-200"
                >
                  + Add Member
                </button>
              </div>

              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 grid grid-cols-9 gap-2 text-sm font-medium text-gray-700">
                  <div className="col-span-4">First Name *</div>
                  <div className="col-span-4">
                    Last Name <span className="text-gray-400 font-normal">(optional)</span>
                  </div>
                  <div className="col-span-1"></div>
                </div>

                {formState.members.map((member, index) => (
                  <div key={index} className="px-4 py-2 grid grid-cols-9 gap-2 border-t border-gray-200">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={member.firstName}
                        onChange={(e) => updateMember(index, "firstName", e.target.value)}
                        placeholder="First name"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={member.lastName}
                        onChange={(e) => updateMember(index, "lastName", e.target.value)}
                        placeholder="Last name"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        disabled={formState.members.length <= 1}
                        className="w-full text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                * At least one member with a first name is required
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={saveParty}
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Party"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PartyCreator;
