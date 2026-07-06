import { randomUUID } from 'crypto'
import { google } from 'googleapis'

export type CalendarAttendee = {
  email: string
  name: string
}

export type CreateCalendarEventParams = {
  startTime: string
  endTime: string
  volunteer: CalendarAttendee
  trainee: CalendarAttendee
}

export type CreateCalendarEventResult = {
  googleEventId: string
  meetLink: string | null
}

function getAuth() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
}

function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: getAuth() })
}

export async function createCalendarEvent(
  params: CreateCalendarEventParams,
): Promise<CreateCalendarEventResult> {
  const { startTime, endTime, volunteer, trainee } = params
  const calendar = getCalendarClient()

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: `Pair Scheduling session: ${volunteer.name} & ${trainee.name}`,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  })

  const meetLink =
    data.hangoutLink ??
    data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri ??
    null

  return { googleEventId: data.id as string, meetLink }
}

export async function deleteCalendarEvent(googleEventId: string): Promise<void> {
  const calendar = getCalendarClient()

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
  })
}
