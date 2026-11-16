"use client";
import { Icon } from "./icon";
import { useId, useRef, useState } from "react";
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
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const [deleteError, setDeleteError] = useState("");
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
    if (!initial || busy) return;
    setBusy(true);
    setDeleteError("");
    try {
      await api("/api/admin/clients/" + initial.id, { method: "DELETE" });
      dialog.current?.close();
      router.replace("/admin/clientes");
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "No se pudo eliminar el cliente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
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
            <Icon name={initial ? "save" : "plus"} size={18} />
            {busy
              ? "Guardando…"
              : initial
                ? "Guardar cliente"
                : "Crear cliente"}
          </button>
          {initial && (
            <button
              type="button"
              className="danger-link"
              disabled={busy}
              onClick={() => {
                setDeleteError("");
                dialog.current?.showModal();
              }}
            >
              <Icon name="trash" size={20} />
              Eliminar cliente
            </button>
          )}
        </div>
      </form>
      {initial && (
        <dialog
          ref={dialog}
          className="confirm-dialog"
          aria-labelledby={dialogTitleId}
          aria-describedby={dialogDescriptionId}
          onCancel={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <h2 id={dialogTitleId}>¿Eliminar este cliente?</h2>
          <p id={dialogDescriptionId}>
            Se eliminará el cliente <strong>{initial.business_name}</strong> y
            sus datos. Esta acción no se puede deshacer desde la aplicación.
          </p>
          <p>
            El cliente no debe tener tarjetas asociadas. Si tiene tarjetas,
            reasígnalas o desvincúlalas antes de eliminarlo.
          </p>
          {deleteError && (
            <p className="notice error" role="alert">
              {deleteError}
            </p>
          )}
          <div className="dialog-actions">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => dialog.current?.close()}
              autoFocus
            >
              <Icon name="close" size={18} />
              Cancelar
            </button>
            <button
              type="button"
              className="danger"
              disabled={busy}
              onClick={remove}
            >
              <Icon name="trash" size={20} />
              {busy ? "Eliminando…" : "Eliminar cliente"}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
