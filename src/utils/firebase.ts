import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Party, GuestRSVP } from "@/types/rsvp";

export async function searchParties(searchTerm: string): Promise<Party[]> {
  if (!searchTerm.trim()) return [];

  const searchLower = searchTerm.toLowerCase().trim();
  const tokens = searchLower.split(" ").filter(Boolean);

  const partiesRef = collection(db, "parties");
  const snapshot = await getDocs(partiesRef);
  const results: Party[] = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const party: Party = {
      id: doc.id,
      label: data.label,
      members: data.members || [],
      partyId: data.partyId,
      partyLabel: data.partyLabel,
      confirmationCode: data.confirmationCode,
      createdAt: data.createdAt,
      guests: data.guests,
    };

    const hasMatch = party.members.some((member) => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      if (fullName.includes(searchLower)) return true;
      return tokens.every((token) => fullName.includes(token));
    });

    if (hasMatch) results.push(party);
  });

  return results;
}

export async function getParty(partyId: string): Promise<Party | null> {
  try {
    const partyDoc = await getDoc(doc(db, "parties", partyId));
    if (!partyDoc.exists()) return null;

    const data = partyDoc.data();
    return {
      id: partyDoc.id,
      label: data.label,
      members: data.members || [],
      partyId: data.partyId,
      partyLabel: data.partyLabel,
      confirmationCode: data.confirmationCode,
      createdAt: data.createdAt,
      guests: data.guests,
      allowPlusOne: data.allowPlusOne,
    };
  } catch (error) {
    console.error("Error fetching party:", error);
    return null;
  }
}

export async function getPartyByConfirmationCode(
  confirmationCode: string
): Promise<Party | null> {
  try {
    const partiesRef = collection(db, "parties");
    const snapshot = await getDocs(partiesRef);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.confirmationCode === confirmationCode) {
        return {
          id: doc.id,
          label: data.label,
          members: data.members || [],
          partyId: data.partyId,
          partyLabel: data.partyLabel,
          confirmationCode: data.confirmationCode,
          createdAt: data.createdAt,
          guests: data.guests,
          message: data.message,
          transport: data.transport,
          allowPlusOne: data.allowPlusOne,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching party by confirmation code:", error);
    return null;
  }
}

function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function submitRSVP(
  partyId: string,
  partyLabel: string | undefined,
  rsvpsByGuest: Record<string, GuestRSVP>,
  message: string = "",
  transport?: boolean
): Promise<string> {
  const confirmationCode = generateConfirmationCode();
  const createdAt = Date.now();

  const partyRef = doc(db, "parties", partyId);

  await setDoc(
    partyRef,
    {
      partyId,
      partyLabel,
      guests: Object.values(rsvpsByGuest),
      confirmationCode,
      createdAt,
      message,
      ...(transport !== undefined && { transport }),
    },
    { merge: true }
  );

  return confirmationCode;
}
