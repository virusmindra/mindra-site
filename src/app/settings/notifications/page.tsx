import QuietHoursCard from "./QuietHoursCard";

export default function NotificationsSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <QuietHoursCard />
    </div>
  );
}
