const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export type EmailPerson = {
  email: string
  name: string
}

type BookingEmailParams = {
  volunteer: EmailPerson
  trainee: EmailPerson
  startTime: string
  endTime: string
}

function formatSessionTime(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const dateStr = start.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const startStr = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const endStr = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${dateStr}, ${startStr}–${endStr}`
}

async function sendEmail(to: EmailPerson, subject: string, htmlContent: string): Promise<void> {
  await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY ?? '',
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME ?? '',
        email: process.env.BREVO_SENDER_EMAIL ?? '',
      },
      to: [{ email: to.email, name: to.name }],
      subject,
      htmlContent,
    }),
  })
}

export async function sendBookingConfirmationEmail(
  params: BookingEmailParams & { meetLink: string | null },
): Promise<void> {
  const { volunteer, trainee, startTime, endTime, meetLink } = params
  const when = formatSessionTime(startTime, endTime)
  const subject = 'Your Pair Scheduling session is confirmed'
  const meetLine = meetLink
    ? `<p>Join via Google Meet: <a href="${meetLink}">${meetLink}</a></p>`
    : ''

  await Promise.all([
    sendEmail(
      volunteer,
      subject,
      `<p>Your session with <strong>${trainee.name}</strong> is confirmed for <strong>${when}</strong>.</p>
       ${meetLine}`,
    ),
    sendEmail(
      trainee,
      subject,
      `<p>Your session with <strong>${volunteer.name}</strong> is confirmed for <strong>${when}</strong>.</p>
       ${meetLine}`,
    ),
  ])
}

export async function sendBookingCancellationEmail(params: BookingEmailParams): Promise<void> {
  const { volunteer, trainee, startTime, endTime } = params
  const when = formatSessionTime(startTime, endTime)
  const subject = 'Your Pair Scheduling session has been cancelled'

  await Promise.all([
    sendEmail(
      volunteer,
      subject,
      `<p>Your session with <strong>${trainee.name}</strong> scheduled for <strong>${when}</strong> has been cancelled.</p>`,
    ),
    sendEmail(
      trainee,
      subject,
      `<p>Your session with <strong>${volunteer.name}</strong> scheduled for <strong>${when}</strong> has been cancelled.</p>`,
    ),
  ])
}
