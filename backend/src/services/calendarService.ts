import { randomBytes } from 'crypto'

export type CreateMeetingLinkResult = {
  meetLink: string
}

export function createMeetingLink(): CreateMeetingLinkResult {
  const roomId = randomBytes(8).toString('hex')
  return { meetLink: `https://meet.jit.si/pair-scheduling-${roomId}` }
}
