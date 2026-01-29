import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/developer')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/developer"!</div>;
}
