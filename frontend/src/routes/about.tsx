import { createFileRoute } from '@tanstack/react-router'

// about.tsx → "/about"
export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div>
      <h1>ℹ️ About</h1>
      <p>
        This is a simple fullstack project built to schedule 1:1 sessions with volunteers or trainees. 
      </p>
    </div>
  )
}
