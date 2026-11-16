"use client";
import { Icon } from "./icon";
import { useEffect, useState } from "react";
import Link from "@/components/private-link";
import { api } from "@/lib/client-api";
import type { Client } from "@/lib/types";
import { ClientForm } from "./client-form";
type Result = {
  clients: (Client & { cards: { count: number }[] })[];
  page: number;
  pages: number;
  total: number;
};
export function Clients() {
  const [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ q: "", page: 1 }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      setError("");
      try {
        setResult(
          await api<Result>(
            "/api/admin/clients?" +
              new URLSearchParams({ q: filter.q, page: String(filter.page) }),
            { signal: ctrl.signal },
          ),
        );
      } catch (e) {
        if (!ctrl.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudieron cargar los clientes.",
          );
      }
    }
    void load();
    return () => ctrl.abort();
  }, [filter, revision]);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Clientes</h1>
          <p>Un negocio, un enlace de destino y todas sus tarjetas.</p>
        </div>
      </div>
      <ClientForm onSaved={() => setRevision((n) => n + 1)} />
      <section className="panel">
        <form
          className="filter-row"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter({ q: search, page: 1 });
          }}
        >
          <input
            aria-label="Buscar cliente"
            placeholder="Buscar negocio…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={160}
          />
          <button>
            <Icon name="search" size={18} />
            Buscar
          </button>
        </form>
        {error ? (
          <p className="notice error" role="alert">
            {error}
          </p>
        ) : !result ? (
          <p className="loading-state">Cargando clientes…</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Tarjetas</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {result.clients.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={"/admin/clientes/" + c.id}>
                          {c.business_name}
                        </Link>
                      </td>
                      <td>{c.cards[0]?.count ?? 0}</td>
                      <td>
                        <Link
                          className="table-action"
                          href={"/admin/clientes/" + c.id}
                        >
                          Administrar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!result.clients.length && (
              <p className="empty-state">No hay clientes para esta búsqueda.</p>
            )}
            <div className="pagination">
              <span>
                {result.total} clientes · Página {result.page} de {result.pages}
              </span>
              <div>
                <button
                  className="secondary"
                  disabled={filter.page <= 1}
                  onClick={() =>
                    setFilter({ ...filter, page: filter.page - 1 })
                  }
                >
                  <Icon name="previous" size={18} />
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
                  <Icon name="arrow" size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
