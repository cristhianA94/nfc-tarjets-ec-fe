"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { api, dateLabel } from "@/lib/client-api";
import { type Card, type CardStatus, statusLabels } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { Icon } from "./icon";
type Result = { cards: Card[]; total: number; page: number; pages: number };
export function CardList() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState({ q: "", status: "", page: 1 });
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      setBusy(true);
      setError("");
      try {
        const p = new URLSearchParams({
          q: filter.q,
          status: filter.status,
          page: String(filter.page),
        });
        const next = await api<Result>("/api/admin/cards?" + p, {
          signal: ctrl.signal,
        });
        setResult(next);
      } catch (e) {
        if (!ctrl.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudieron cargar las tarjetas.",
          );
      } finally {
        if (!ctrl.signal.aborted) setBusy(false);
      }
    }
    void load();
    return () => ctrl.abort();
  }, [filter, reload]);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TU PUNTO DE CONEXIÓN</span>
          <h1>Tarjetas NFC</h1>
          <p>Crea, activa y administra tus tarjetas en un solo lugar.</p>
        </div>
        <Link className="button" href="/admin/tarjetas/nueva">
          <Icon name="plus" size={18} />
          Nueva tarjeta
        </Link>
      </div>
      <section className="quick-strip">
        <span className="quick-icon">
          <Icon name="signal" size={26} />
        </span>
        <div>
          <strong>Activa una tarjeta en el momento.</strong>
          <p>
            Busca su código, asigna el negocio y guarda el enlace de sus
            reseñas.
          </p>
        </div>
        <span className="quick-label">LISTA PARA VENDER</span>
      </section>
      <section className="panel list-panel">
        <div className="section-heading">
          <h2>
            Tus tarjetas <span className="count">{result?.total ?? "…"}</span>
          </h2>
          <span className="muted small">
            La URL NFC permanece al cambiar el destino
          </span>
        </div>
        <form
          className="filter-row"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter({ ...filter, q: query.trim(), page: 1 });
          }}
        >
          <div className="search-field">
            <Icon name="search" size={18} />
            <input
              aria-label="Buscar por código o negocio"
              placeholder="Buscar por código o negocio…"
              maxLength={160}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="sr-only" htmlFor="status-filter">
            Estado
          </label>
          <select
            id="status-filter"
            value={filter.status}
            onChange={(e) =>
              setFilter({ ...filter, status: e.target.value, page: 1 })
            }
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button className="secondary" type="submit">
            Buscar
          </button>
        </form>
        {error ? (
          <div className="empty-state" role="alert">
            <h3>No pudimos cargar las tarjetas.</h3>
            <p>{error}</p>
            <button
              className="secondary"
              onClick={() => setReload((n) => n + 1)}
            >
              Volver a intentar
            </button>
          </div>
        ) : busy ? (
          <div className="loading-state" role="status">
            Cargando tarjetas…
          </div>
        ) : !result?.cards.length ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="cards" size={32} />
            </span>
            <h3>
              {filter.q || filter.status
                ? "No encontramos coincidencias."
                : "Tu primera tarjeta empieza aquí."}
            </h3>
            <p>
              {filter.q || filter.status
                ? "Prueba con otro código, negocio o estado."
                : "Crea una tarjeta y copia su URL para programar el NFC."}
            </p>
            {!filter.q && !filter.status && (
              <Link className="button" href="/admin/tarjetas/nueva">
                Crear primera tarjeta
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tarjeta / Negocio</th>
                    <th>Estado</th>
                    <th>Creación (UTC)</th>
                    <th>Activación (UTC)</th>
                    <th>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.cards.map((card) => (
                    <tr key={card.id}>
                      <td>
                        <Link
                          className="card-code"
                          href={"/admin/tarjetas/" + card.public_code}
                        >
                          {card.public_code}
                        </Link>
                        <span className="business-name">
                          {card.business_name || "Sin negocio asignado"}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={card.status as CardStatus} />
                      </td>
                      <td className="date-cell">
                        {dateLabel(card.created_at)}
                      </td>
                      <td className="date-cell">
                        {dateLabel(card.activated_at)}
                      </td>
                      <td>
                        <Link
                          className="table-action"
                          href={"/admin/tarjetas/" + card.public_code}
                          aria-label={"Administrar tarjeta " + card.public_code}
                        >
                          Administrar
                          <Icon name="arrow" size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                {result.total} tarjetas · Página {result.page} de {result.pages}
              </span>
              <div>
                <button
                  className="secondary"
                  disabled={filter.page <= 1}
                  onClick={() =>
                    setFilter({ ...filter, page: filter.page - 1 })
                  }
                >
                  Anterior
                </button>
                <button
                  className="secondary"
                  disabled={filter.page >= result.pages}
                  onClick={() =>
                    setFilter({ ...filter, page: filter.page + 1 })
                  }
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <p className="helper-foot">
        <Icon name="signal" size={16} />
        Programa cada etiqueta con su URL permanente usando NFC Tools.
      </p>
    </>
  );
}
