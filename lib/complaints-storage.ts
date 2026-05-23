"use client";

export type ComplaintTicket = {
  id: string;
  pagePath: string;
  name: string;
  contact: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "aberta" | "respondida";
  adminReply: string;
  repliedAt?: string;
};

const COMPLAINTS_KEY = "ppb_complaints_v1";

function normalizeComplaint(input: unknown): ComplaintTicket | null {
  if (!input || typeof input !== "object") return null;
  const item = input as Partial<ComplaintTicket>;
  if (
    typeof item.id !== "string" ||
    typeof item.pagePath !== "string" ||
    typeof item.name !== "string" ||
    typeof item.contact !== "string" ||
    typeof item.subject !== "string" ||
    typeof item.message !== "string" ||
    typeof item.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    pagePath: item.pagePath,
    name: item.name,
    contact: item.contact,
    subject: item.subject,
    message: item.message,
    createdAt: item.createdAt,
    status: item.status === "respondida" ? "respondida" : "aberta",
    adminReply: typeof item.adminReply === "string" ? item.adminReply : "",
    repliedAt: typeof item.repliedAt === "string" ? item.repliedAt : undefined
  };
}

export function readComplaints() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(COMPLAINTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeComplaint).filter(Boolean) as ComplaintTicket[];
  } catch {
    return [];
  }
}

export function writeComplaints(list: ComplaintTicket[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(list));
}

export function createComplaint(input: Omit<ComplaintTicket, "id" | "createdAt" | "status" | "adminReply">) {
  const current = readComplaints();
  const next: ComplaintTicket = {
    id: crypto.randomUUID(),
    pagePath: input.pagePath,
    name: input.name,
    contact: input.contact,
    subject: input.subject,
    message: input.message,
    createdAt: new Date().toISOString(),
    status: "aberta",
    adminReply: ""
  };

  writeComplaints([next, ...current]);
  return next;
}

export function replyComplaint(complaintId: string, reply: string) {
  const current = readComplaints();
  const next = current.map((complaint) =>
    complaint.id === complaintId
      ? {
          ...complaint,
          adminReply: reply,
          status: "respondida" as const,
          repliedAt: new Date().toISOString()
        }
      : complaint
  );

  writeComplaints(next);
  return next;
}
