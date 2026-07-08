import { createFileRoute } from '@tanstack/react-router'
import styles from './home.module.css'

// File name determines the URL path: index.tsx → "/"
export const Route = createFileRoute('/')({
  component: HomePage,
})

const roles = [
  {
    key: 'volunteer',
    name: 'Volunteer',
    accentClass: styles.roleVolunteer,
    description:
      'Set your own availability, manage your time slots, and see who you are paired with, all in one place.',
    points: [
      'Add one-off or recurring weekly slots',
      'See who is booked into each session',
      'Cancel or adjust slots any time',
    ],
  },
  {
    key: 'trainee',
    name: 'Trainee',
    accentClass: styles.roleTrainee,
    description:
      'Browse available time slots, select a time that works for you, and get a confirmation email with the details.',
    points: [
      'See all open slots at a glance',
      'Book with a single click',
      'Get a confirmation email instantly',
    ],
  },
]

const steps = [
  {
    title: 'Volunteers set availability',
    text: 'Add open time slots whenever it suits you, one-off or recurring every week.',
  },
  {
    title: 'Trainees pick a time',
    text: 'Browse open slots and grab one that fits your schedule, no back-and-forth emails.',
  },
  {
    title: 'Everyone gets a confirmation',
    text: 'Both sides receive the details by email, so nothing gets lost or forgotten.',
  },
]

export function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMark} aria-hidden="true">
          <svg viewBox="0 0 220 140" className={styles.venn}>
            <circle className={styles.vennVolunteer} cx="90" cy="70" r="62" />
            <circle className={styles.vennTrainee} cx="150" cy="70" r="62" />
          </svg>
        </div>
        <p className={styles.eyebrow}>For volunteers &amp; trainees</p>
        <h1 className={styles.title}>Pair Scheduling</h1>
        <p className={styles.subtitle}>
          Book a 1:1 session in a couple of clicks, no more hunting through links.
        </p>
      </section>

      <section className={styles.rolesSection}>
        <div className={styles.rolesRow}>
          {roles.map((role) => (
            <div key={role.key} className={`${styles.roleCard} ${role.accentClass}`}>
              <span className={styles.roleTag}>{role.name}</span>
              <p className={styles.roleText}>{role.description}</p>
              <ul className={styles.roleList}>
                {role.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.stepsRow}>
          {steps.map((step, i) => (
            <div key={step.title} className={styles.stepCard}>
              <div className={styles.stepNumber}>{String(i + 1).padStart(2, '0')}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
