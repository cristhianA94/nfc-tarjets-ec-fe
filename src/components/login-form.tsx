"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { Brand } from "./brand";
import { Icon } from "./icon";
export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email")).trim(),
          password: String(form.get("password")),
        }),
      });
      router.replace("/admin/tarjetas");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand />
        <div>
          <span className="eyebrow light">UNA CONEXIÓN MÁS SIMPLE</span>
          <h1>
            Un toque.
            <br />
            Una nueva
            <br />
            <span>conversación.</span>
          </h1>
          <p>
            Administra tus tarjetas y conecta a cada negocio con sus reseñas de
            Google.
          </p>
          <div className="login-art">
            <Image
              src="/android-chrome-512x512.png"
              width={512}
              height={512}
              alt="Logotipo de NexTap con ondas NFC y estrellas"
              className="login-brand-art"
              unoptimized
            />
            <span className="login-art-caption">
              UNA MARCA. MUCHAS CONEXIONES.
            </span>
          </div>
        </div>
        <small>NexTap · Gestión de tarjetas</small>
      </section>
      <section className="login-side">
        <form className="login-form" onSubmit={submit}>
          <span className="eyebrow">ACCESO ADMINISTRATIVO</span>
          <h2>Bienvenido de nuevo.</h2>
          <p className="muted">Inicia sesión para administrar tus tarjetas.</p>
          <label>
            Correo electrónico
            <input
              name="email"
              type="email"
              autoComplete="username"
              placeholder="correo@ejemplo.com"
              required
              maxLength={254}
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={1024}
            />
          </label>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          <button className="full-width" disabled={busy}>
            {busy ? "Iniciando sesión…" : "Iniciar sesión"}
            <Icon name="arrow" size={17} />
          </button>
          <p className="login-foot">
            Acceso exclusivo para administradores autorizados.
          </p>
        </form>
      </section>
    </main>
  );
}
