export type YesNo = "yes" | "no";

export type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
};

export type Party = {
  id: string;
  label?: string;
  members: Guest[];
  partyId?: string;
  partyLabel?: string;
  confirmationCode?: string;
  createdAt?: number;
  guests?: GuestRSVP[];
  message?: string;
  transport?: boolean;
  invitationSent?: boolean;
  allowPlusOne?: boolean;
};

export type GuestRSVP = {
  guestId: string;
  firstName: string;
  lastName: string;
  email?: string;
  rsvp?: YesNo;
  isPlusOne?: boolean;
};

export type FormState = {
  party?: Party;
  rsvpsByGuest: Record<string, GuestRSVP>;
  confirmationCode?: string;
  transport?: boolean;
  message?: string;
};
