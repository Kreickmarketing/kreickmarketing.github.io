import Image from "next/image";

// Shared frame for the login, forgot-password and reset pages.
export default function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="crm-login">
      <div className="crm-login-card">
        <div className="crm-login-head">
          <Image src="/logo-white.png" alt="ClearMark" width={160} height={40} className="crm-login-logo" />
        </div>
        <div className="crm-login-body">
          <p className="tagline">Team only</p>
          <h6>{title}</h6>
          {children}
        </div>
      </div>
    </main>
  );
}
