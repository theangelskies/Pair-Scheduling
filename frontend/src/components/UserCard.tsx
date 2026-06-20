import styles from './UserCard.module.css'

// Define prop types – always type your component props!
interface UserCardProps {
  name: string
  role: string
}

// UserCard is a simple presentational component.
// Put reusable UI pieces like this in src/components/.
export function UserCard({ name, role }: UserCardProps) {
  return (
    <div className={styles.card}>
      <strong>{name}</strong>
      {' — '}
      <em>{role}</em>
    </div>
  )
}
