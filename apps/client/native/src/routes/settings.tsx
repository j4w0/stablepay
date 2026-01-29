import { createFileRoute } from '@tanstack/react-router';
import { SettingsImpl } from '../services/SettingsService';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  return <SettingsImpl />;
}
