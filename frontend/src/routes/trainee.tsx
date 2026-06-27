import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/trainee')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/trainee"!</div>
}
