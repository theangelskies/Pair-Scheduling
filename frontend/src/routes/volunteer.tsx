import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/volunteer')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/volunteer"!</div>
}
