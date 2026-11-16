"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/lib/types";
import { api } from "@/lib/client-api";
export function ClientForm({
  initial,
  onSaved,
}: {
  initial?: Client;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.business_name ?? ""),
    [url, setUrl] = useState(initial?.google_review_url ?? ""),
    [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/api/admin/clients" + (initial ? "/" + initial.id : ""), {
        method: initial ? "PATCH" : "POST",
        body: JSON.stringify({
          business_name: name,
          google_review_url: url,
          notes,
        }),
      });
      setMessage(
        initial
          ? "Cliente actualizado. El enlace se aplica a todas sus tarjetas."
          : "Cliente creado.",
      );
      if (!initial) {
        setName("");
        setUrl("");
        setNotes("");
      }
      onSaved?.();
      window.dispatchEvent(new Event("nfc:clients-changed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !initial ||
      !window.confirm(
        "¿Eliminar este cliente? Solo es posible si no tiene tarjetas asociadas.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/clients/" + initial.id, { method: "DELETE" });
      router.replace("/admin/clientes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
      setBusy(false);
    }
  }
  return (
    <form
      className="panel card-form"
      onSubmit={save}
      style={{ marginBottom: 28 }}
    >
      <div className="section-heading">
        <h2>{initial ? "Datos del cliente" : "Nuevo cliente"}</h2>
      </div>
      <div className="form-body">
        <label>
          Nombre del negocio
          <input
            required
            maxLength={160}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="organization"
          />
        </label>
        <label>
          Enlace compartido de destino
          <input
            type="url"
            maxLength={2048}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://ejemplo.com/menu"
          />
          <span className="field-help">
            Requerido para activar tarjetas. Cambiarlo actualiza el destino de
            todas las tarjetas de este cliente.
          </span>
        </label>
        <label>
          Observaciones
          <textarea
            maxLength={2000}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice success" role="status">
            {message}
          </p>
        )}
      </div>
      <div className="form-actions">
        <button disabled={busy}>
          {busy ? "Guardando…" : initial ? "Guardar cliente" : "Crear cliente"}
        </button>
        {initial && (
          <button
            type="button"
            className="danger-link"
            disabled={busy}
            onClick={remove}
          >
            Eliminar cliente
          </button>
        )}
      </div>
    </form>
  );
}
