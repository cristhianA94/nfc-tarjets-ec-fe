"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Brand } from "./brand";
import { Icon } from "./icon";
import { api } from "@/lib/client-api";
export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    const expired = () => {
      router.replace("/admin/login");
      router.refresh();
    };
    window.addEventListener("nfc:session-expired", expired);
    return () => window.removeEventListener("nfc:session-expired", expired);
  }, [router]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cerrar la sesión.");
      setBusy(false);
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link
          className="brand-link"
          href="/admin/tarjetas"
          aria-label="NFC, tarjetas"
        >
          <Brand />
        </Link>
        <div className="nav-label">ADMINISTRACIÓN</div>
        <nav aria-label="Navegación principal">
          <Link
            className={
              path.startsWith("/admin/tarjetas")
                ? "nav-link selected"
                : "nav-link"
            }
            href="/admin/tarjetas"
            aria-current={
              path.startsWith("/admin/tarjetas") ? "page" : undefined
            }
          >
            <Icon name="cards" />
            Tarjetas
          </Link>
          <Link
            className={
              path.startsWith("/admin/reportes")
                ? "nav-link selected"
                : "nav-link"
            }
            href="/admin/reportes"
            aria-current={
              path.startsWith("/admin/reportes") ? "page" : undefined
            }
          >
            <Icon name="reports" />
            Reportes
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="account">
            <span className="avatar">AD</span>
            <div>
              <strong>Administrador</strong>
              <span title={email}>{email}</span>
            </div>
          </div>
          <button className="logout" onClick={logout} disabled={busy}>
            <Icon name="logout" />
            {busy ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>Panel de administración</span>
          <span className="private-label">
            <span className="status-dot" />
            Acceso privado
          </span>
        </header>
        <main id="contenido" className="main-content">
          {children}
        </main>
        <footer className="app-footer">
          NFC · Gestión de tarjetas<span>Simple. Directo. Sin contacto.</span>
        </footer>
      </div>
    </div>
  );
}
