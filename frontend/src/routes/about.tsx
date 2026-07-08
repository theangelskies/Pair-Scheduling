// import { createFileRoute } from '@tanstack/react-router'

// // about.tsx → "/about"
// export const Route = createFileRoute('/about')({
//   component: AboutPage,
// })

// function AboutPage() {
//   return (
//     <div>
//       <h1>ℹ️ About</h1>
//       <p>
//         This is a simple fullstack project built to schedule 1:1 sessions with volunteers or
//         trainees.
//       </p>
//     </div>
//   )
// }
import { createFileRoute } from '@tanstack/react-router'
import styles from './about.module.css'
import angelaImg from '../foto/angela.jpg'
import faithImg from '../foto/faith.jpg'
import fangImg from '../foto/fa.png'

// about.tsx → "/about"
export const Route = createFileRoute('/about')({
  component: AboutPage,
})

type TeamMember = {
  name: string
  role: string
  avatarUrl: string
}

type Contributor = {
  name: string
  role: string
}

const team: TeamMember[] = [
  {
    name: 'Angela',
    role: 'Team Leader',
    avatarUrl: angelaImg,
  },
  {
    name: 'Faith',
    role: 'Backend & Frontend Developer',
    avatarUrl: faithImg,
  },
  {
    name: 'Fang',
    role: 'Backend & Frontend Developer',
    avatarUrl: fangImg,
  },
]

const contributors: Contributor[] = [
  { name: 'Sunny', role: 'Product Owner' },
  { name: 'Manu', role: 'Tech Lead' },
]

function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>About Us</h1>
      </div>

      <div className={styles.teamSection}>
        <h2 className={styles.sectionTitle}>The team</h2>
        <div className={styles.teamRow}>
          {team.map((member) => (
            <div key={member.name} className={styles.memberCard}>
              <img className={styles.avatar} src={member.avatarUrl} alt={member.name} />
              <h3 className={styles.memberName}>{member.name}</h3>
              <p className={styles.memberRole}>{member.role}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.teamSection}>
        <h2 className={styles.sectionTitle}>Special thanks</h2>
        <div className={styles.contributorRow}>
          {contributors.map((person) => (
            <div key={person.name} className={styles.contributorCard}>
              <span className={styles.contributorBadge}>Special Contribution</span>
              <p className={styles.memberRole}>{person.role}</p>
              <h3 className={styles.memberName}>{person.name}</h3>
             </div>
        ))}
        </div>
      </div>
    </div>
  )
}

