import { createFileRoute } from '@tanstack/react-router'

// File name determines the URL path:  index.tsx → "/"
export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div>
      <h1>Pair Scheduling</h1>
      <p>Book a 1:1 session in a couple of clicks, no more hunting through links.</p>
      <p>
        Edit <code>src/routes/index.tsx</code> to change this page.
      </p>
    </div>
  )
}
