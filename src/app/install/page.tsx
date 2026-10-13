import { AppShell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
export default function InstallPage() {
  return <AppShell>
    <PageHeader title="Keep Workshop on your device" description="Open your writing from an app icon. Your draft saves on this device as you type." />
    <div className="max-w-2xl space-y-6 leading-7">
      <section className="card p-6"><h2 className="font-serif text-xl">iPhone or iPad</h2>
        <p className="mt-3">Open Workshop in Safari, tap Share, then Add to Home Screen. Leave Open as Web App on and tap Add. Open the new icon before writing your first draft.</p></section>
      <section className="card p-6"><h2 className="font-serif text-xl">Mac</h2>
        <p className="mt-3">Open Workshop in Safari, choose File, then Add to Dock. After that, open Workshop from its icon in the Dock or Applications.</p></section>
      <section className="card p-6"><h2 className="font-serif text-xl">Your writing stays here</h2>
        <p className="mt-3">Closing the app keeps your draft. You can keep writing offline after the app has loaded once. Use Save a backup in Write before changing devices, removing the app or clearing its data. Restore that file on your other device. Safari and an installed app keep separate drafts.</p>
        <p className="mt-3">Chats, multiplayer games, critiques, shared drafts and publishing need an internet connection. Those activities use the shared database. Sign in to return to your account on another device.</p></section>
    </div>
  </AppShell>;
}
