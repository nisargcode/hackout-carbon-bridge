import { create } from "zustand";
import { type Mail, mails as defaultMails } from "./data";

export type MailFolder = "inbox" | "sent" | "drafts" | "archive" | "trash";

type Config = {
  selected: Mail["id"] | null;
};

export interface ComposeDefault {
  recipientId?: string;
  recipientName?: string;
  recipientEmail?: string;
  subject?: string;
}

type MailStore = {
  mail: Config;
  activeFolder: MailFolder;
  activeLabel: string | null;
  isComposeOpen: boolean;
  composeDefault: ComposeDefault | null;
  mails: Mail[];
  searchQuery: string;
  setMail: (mail: Config) => void;
  setActiveFolder: (folder: MailFolder) => void;
  setActiveLabel: (label: string | null) => void;
  setIsComposeOpen: (open: boolean, defaults?: ComposeDefault | null) => void;
  setMails: (mails: Mail[]) => void;
  addMail: (mail: Mail) => void;
  updateMail: (id: string, updates: Partial<Mail>) => void;
  removeMail: (id: string) => void;
  setSearchQuery: (query: string) => void;
};

export const useMailStore = create<MailStore>((set) => ({
  mail: {
    selected: defaultMails[0]?.id || null,
  },
  activeFolder: "inbox",
  activeLabel: null,
  isComposeOpen: false,
  composeDefault: null,
  mails: defaultMails,
  searchQuery: "",
  setMail: (mail) => set({ mail }),
  setActiveFolder: (activeFolder) => set({ activeFolder, activeLabel: null }),
  setActiveLabel: (activeLabel) => set({ activeLabel }),
  setIsComposeOpen: (isComposeOpen, defaults = null) =>
    set({ isComposeOpen, composeDefault: defaults || null }),
  setMails: (mails) =>
    set((state) => {
      // Ensure current selected exists in new list or fallback
      const exists = mails.some((m) => m.id === state.mail.selected);
      const selected = exists ? state.mail.selected : mails[0]?.id || null;
      return { mails, mail: { selected } };
    }),
  addMail: (newMail) =>
    set((state) => ({
      mails: [newMail, ...state.mails],
      mail: { selected: newMail.id },
    })),
  updateMail: (id, updates) =>
    set((state) => ({
      mails: state.mails.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  removeMail: (id) =>
    set((state) => {
      const filtered = state.mails.filter((m) => m.id !== id);
      return {
        mails: filtered,
        mail: {
          selected: state.mail.selected === id ? filtered[0]?.id || null : state.mail.selected,
        },
      };
    }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));

export function useMail() {
  const mail = useMailStore((state) => state.mail);
  const setMail = useMailStore((state) => state.setMail);
  return [mail, setMail] as const;
}
