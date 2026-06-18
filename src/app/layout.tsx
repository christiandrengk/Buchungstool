import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forschungsraum – Buchung & Ausleihe",
  description:
    "Buchungs- und Ausleihtool für den gemeinsamen Forschungsraum des Instituts für Sonderpädagogik.",
};

const navItems = [
  { href: "/", label: "Übersicht" },
  { href: "/plaetze", label: "Platz buchen" },
  { href: "/geraete", label: "Gerät ausleihen" },
  { href: "/admin", label: "Verwaltung" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-lg font-semibold text-brand-dark">
              🔬 Forschungsraum · Buchung &amp; Ausleihe
            </Link>
            <nav className="flex flex-wrap gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-slate-400">
          v1 (MVP) · Ohne Login · Alle Buchungen sind für alle sichtbar
        </footer>
      </body>
    </html>
  );
}
