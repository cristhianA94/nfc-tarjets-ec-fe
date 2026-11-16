"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, dateLabel } from "@/lib/client-api";
import type { Report } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { Icon } from "./icon";
export function Reports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filter, setFilter] = useState({ from: "", to: "", page: 1 });
  const [data, setData] = useState<Report | null>(null);
  const [busy, setBusy] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const params = new URLSearchParams({
    from: filter.from,
    to: filter.to,
    page: String(filter.page),
  }).toString();
  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      setBusy(true);
      setError("");
      try {
        setData(
          await api<Report>("/api/admin/reports?" + params, {
            signal: ctrl.signal,
          }),
        );
      } catch (e) {
        if (!ctrl.signal.aborted)
          setError(
            e instanceof Error ? e.message : "No se pudo cargar el reporte.",
          );
      } finally {
        if (!ctrl.signal.aborted) setBusy(false);
      }
    }
    void load();
    return () => ctrl.abort();
  }, [params, reload]);
  async function download() {
    setDownloading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/reports/csv?" + params, {
        cache: "no-store",
      });
      if (!response.ok) {
        const problem = await response.json();
        throw new Error(problem.error || "No se pudo exportar.");
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "activaciones-nfc.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo exportar el reporte.",
      );
    } finally {
      setDownloading(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">UNA VISTA DE TUS TARJETAS</span>
          <h1>Reportes</h1>
          <p>Consulta el estado actual y las activaciones por periodo.</p>
        </div>
        <button
          className="secondary"
          disabled={busy || downloading || !data}
          onClick={download}
        >
          <Icon name="reports" size={18} />
          {downloading ? "Exportando…" : "Exportar CSV"}
        </button>
      </div>
      <div className="stats-grid">
        {[
          ["Total de tarjetas", data?.total],
          ["Disponibles", data?.available],
          ["Activas", data?.active],
          ["Suspendidas", data?.suspended],
        ].map(([label, value]) => (
          <section className="panel stat" key={label}>
            <span>{label}</span>
            <strong>{busy ? "…" : (value ?? "Sin datos")}</strong>
          </section>
        ))}
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Activaciones</h2>
            <p className="muted small">
              La fecha corresponde a la primera activación. Rango inclusivo en
              UTC.
            </p>
          </div>
          <span className="count">{busy ? "…" : (data?.activations ?? 0)}</span>
        </div>
        <form
          className="filter-row date-filters"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter({ from, to, page: 1 });
          }}
        >
          <label>
            Desde
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button className="secondary" type="submit">
            Aplicar filtro
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
              setFilter({ from: "", to: "", page: 1 });
            }}
          >
            Todo el periodo
          </button>
        </form>
        {error && (
          <div className="notice error" role="alert">
            {error}
            <button
              className="text-button"
              onClick={() => setReload((n) => n + 1)}
            >
              Reintentar
            </button>
          </div>
        )}
        {busy ? (
          <div className="loading-state" role="status">
            Cargando reportes…
          </div>
        ) : !data?.cards.length ? (
          <div className="empty-state">
            <Icon name="reports" size={32} />
            <h3>Sin activaciones en este periodo.</h3>
            <p>Las tarjetas aparecerán aquí cuando las actives.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tarjeta</th>
                    <th>Negocio</th>
                    <th>Activación (UTC)</th>
                    <th>Estado actual</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cards.map((card) => (
                    <tr key={card.id}>
                      <td>
                        <Link
                          className="card-code"
                          href={"/admin/tarjetas/" + card.public_code}
                        >
                          {card.public_code}
                        </Link>
                      </td>
                      <td>{card.business_name || "Sin negocio asignado"}</td>
                      <td>{dateLabel(card.activated_at)}</td>
                      <td>
                        <StatusBadge status={card.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                Página {data.page} de {data.pages}
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
                  disabled={filter.page >= data.pages}
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
        Los totales muestran el estado actual de todas las tarjetas. El rango de
        fechas se aplica a las activaciones y al CSV.
      </p>
    </>
  );
}
