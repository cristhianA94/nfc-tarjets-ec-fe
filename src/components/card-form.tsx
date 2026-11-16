"use client";
import Link from "@/components/private-link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, dateLabel } from "@/lib/client-api";
import { type Card, type CardStatus, statusLabels } from "@/lib/types";
import { ClientPicker } from "./client-picker";
import { CopyUrl } from "./copy-url";
import { StatusBadge } from "./status-badge";
import { Icon } from "./icon";
export function CardForm({
  initial,
  baseUrl,
  initialClientId,
}: {
  initial?: Card;
  baseUrl: string;
  initialClientId?: string;
}) {
  const router = useRouter();
  const [card, setCard] = useState(initial);
  const [clientId, setClientId] = useState(
    initial?.client_id ?? initialClientId ?? "",
  );
  const [label, setLabel] = useState(initial?.label ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<CardStatus>(
    initial?.status ?? "AVAILABLE",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const permanent = card ? baseUrl + "/r/" + card.public_code : "";
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const intent = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const nextStatus = intent?.value === "activate" ? "ACTIVE" : status;
    const fields = { client_id: clientId || null, label, notes };
    try {
      const result = await api<{ card: Card }>(
        card ? "/api/admin/cards/" + card.public_code : "/api/admin/cards",
        {
          method: card ? "PATCH" : "POST",
          body: JSON.stringify(
            card ? { ...fields, status: nextStatus } : fields,
          ),
        },
      );
      setCard(result.card);
      setStatus(result.card.status);
      setMessage(
        result.card.status === "ACTIVE"
          ? "Tarjeta activa. Puedes probar su URL NFC."
          : card
            ? "Cambios guardados."
            : "Tarjeta creada. Copia su URL para programar el NFC.",
      );
      if (!card) router.replace("/admin/tarjetas/" + result.card.public_code);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar la tarjeta.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!card) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/cards/" + card.public_code, { method: "DELETE" });
      dialog.current?.close();
      router.replace("/admin/tarjetas");
    } catch (e) {
      dialog.current?.close();
      setError(
        e instanceof Error ? e.message : "No se pudo eliminar la tarjeta.",
      );
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" href="/admin/tarjetas">
        ← Volver a tarjetas
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {card ? "ADMINISTRAR TARJETA" : "PREPARAR UNA NUEVA CONEXIÓN"}
          </span>
          <h1>{card ? card.public_code : "Nueva tarjeta"}</h1>
          <p>
            {card
              ? "Actualiza el negocio o activa la tarjeta desde aquí."
              : "El código público se generará al guardar."}
          </p>
        </div>
        {card && <StatusBadge status={card.status} />}
      </div>
      <div className="form-layout">
        <form className="panel card-form" onSubmit={save}>
          <div className="section-heading">
            <h2>Datos de la tarjeta</h2>
            <span className="muted small">
              {card ? "Edición" : "Estado inicial: Disponible"}
            </span>
          </div>
          <div className="form-body">
            <ClientPicker
              value={clientId}
              onChange={setClientId}
              initialName={initial?.business_name}
            />
            <label>
              Identificación de la tarjeta
              <span className="optional">Opcional: Mesa 1, Terraza, Caja…</span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={80}
                placeholder="Ej. Mesa 1"
              />
            </label>
            {card && (
              <label>
                Estado
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CardStatus)}
                >
                  {Object.entries(statusLabels)
                    .filter(([key]) => key !== "SUSPENDED" || card.activated_at)
                    .map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </select>
                <span className="field-help">
                  Suspender conserva los datos y detiene la redirección a el
                  destino.
                </span>
              </label>
            )}
            <label>
              Observaciones
              <span className="optional">
                Opcional · Solo para administración
              </span>
              <textarea
                name="notes"
                rows={4}
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles que quieras recordar sobre esta tarjeta."
              />
            </label>
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
            {message && (
              <div className="notice success" role="status">
                {message}
              </div>
            )}
          </div>
          <div className="form-actions">
            <button disabled={busy}>
              <Icon name={card ? "save" : "plus"} size={18} />
              {busy ? "Guardando…" : card ? "Guardar cambios" : "Crear tarjeta"}
            </button>
            {card && card.status !== "ACTIVE" && (
              <button
                className="secondary"
                name="intent"
                value="activate"
                disabled={busy}
              >
                <Icon name="check" size={18} />
                {card.activated_at ? "Reactivar tarjeta" : "Guardar y activar"}
              </button>
            )}
          </div>
        </form>
        <aside className="detail-aside">
          {card ? (
            <>
              <section className="panel nfc-detail">
                <span className="eyebrow">URL PERMANENTE</span>
                <div className="detail-icon">
                  <Icon name="signal" size={36} />
                </div>
                <h2>Una URL para esta tarjeta.</h2>
                <p>
                  Programa este enlace en el chip. Puedes cambiar el negocio o
                  el destino sin reprogramarlo.
                </p>
                <CopyUrl url={permanent} />
                <a
                  className="button secondary full-width"
                  href={permanent}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Probar URL NFC
                  <Icon name="link" size={16} />
                </a>
              </section>
              <section className="panel metadata">
                <dl>
                  <div>
                    <dt>Fecha de creación (UTC)</dt>
                    <dd>{dateLabel(card.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Primera activación (UTC)</dt>
                    <dd>{dateLabel(card.activated_at)}</dd>
                  </div>
                </dl>
              </section>
              <button
                className="danger-link"
                disabled={busy}
                onClick={() => dialog.current?.showModal()}
              >
                <Icon name="trash" size={20} />
                Eliminar tarjeta
              </button>
            </>
          ) : (
            <section className="panel nfc-detail">
              <div className="detail-icon">
                <Icon name="signal" size={36} />
              </div>
              <h2>Primero crea. Después conecta.</h2>
              <ol>
                <li>Guarda la tarjeta para generar su código.</li>
                <li>Copia la URL permanente.</li>
                <li>Grábala con NFC Tools.</li>
                <li>Asigna un negocio cuando la vendas.</li>
              </ol>
              <p className="notice">
                Elige tu dominio definitivo antes de programar las etiquetas
                NFC.
              </p>
            </section>
          )}
        </aside>
      </div>
      <dialog ref={dialog} className="confirm-dialog">
        <h2>¿Eliminar esta tarjeta?</h2>
        <p>
          Eliminar <strong>{card?.public_code}</strong> hará que su URL deje de
          funcionar. Si el NFC ya está programado, puede quedar inutilizado.
        </p>
        <p>
          Si la tarjeta ya fue vendida, considera suspenderla para conservar sus
          datos.
        </p>
        <div className="dialog-actions">
          <button
            className="secondary"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" size={18} />
            Cancelar
          </button>
          <button className="danger" disabled={busy} onClick={remove}>
            <Icon name="trash" size={20} />
            {busy ? "Eliminando…" : "Eliminar tarjeta"}
          </button>
        </div>
      </dialog>
    </>
  );
}
