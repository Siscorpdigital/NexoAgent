import { google, type Auth } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export function getAuthUrl(empresaId: string) {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    state: empresaId,
  });
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function setCredentials(accessToken: string, refreshToken?: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return oauth2Client;
}

export async function createEvent(
  auth: Auth.OAuth2Client,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    attendees?: string[];
  }
) {
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start.toISOString() },
      end: { dateTime: event.end.toISOString() },
      attendees: event.attendees?.map((email) => ({ email })),
    },
  });

  return {
    id: response.data.id!,
    link: response.data.htmlLink!,
  };
}

export async function updateEvent(
  auth: Auth.OAuth2Client,
  calendarId: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    start?: Date;
    end?: Date;
    status?: "confirmed" | "cancelled";
  }
) {
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      summary: updates.summary,
      description: updates.description,
      start: updates.start ? { dateTime: updates.start.toISOString() } : undefined,
      end: updates.end ? { dateTime: updates.end.toISOString() } : undefined,
      status: updates.status,
    },
  });
}

export async function deleteEvent(auth: Auth.OAuth2Client, calendarId: string, eventId: string) {
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId, eventId });
}
