"use client";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/private-link";
import { api } from "@/lib/client-api";
import type { Client } from "@/lib/types";
type Option = Pick<Client, "id" | "business_name">;
export function ClientPicker({
  value,
  onChange,
  initialName,
}: {
  value: string;
  onChange: (id: string) => void;
  initialName?: string | null;
}) {
  const [search, setSearch] = useState(""),
    [request, setRequest] = useState<{ q: string } | null>(null);
  const [clients, setClients] = useState<Option[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const cache = useRef(new Map<string, { at: number; clients: Option[] }>());
  useEffect(() => {
    if (!request) return;
    const ctrl = new AbortController();
    async function load() {
      setError("");
      setBusy(true);
      try {
        const cached = cache.current.get(request!.q);
        if (cached && Date.now() - cached.at < 30000) {
          setClients(cached.clients);
          return;
        }
        const data = await api<{ clients: Option[] }>(
          "/api/admin/clients?" +
            new URLSearchParams({ q: request!.q, picker: "1" }),
          { signal: ctrl.signal },
        );
        if (!ctrl.signal.aborted) {
          cache.current.set(request!.q, {
            at: Date.now(),
            clients: data.clients,
          });
          setClients(data.clients);
        }
      } catch (e) {
        if (!ctrl.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudieron cargar los clientes.",
          );
      } finally {
        if (!ctrl.signal.aborted) setBusy(false);
      }
    }
    void load();
    return () => ctrl.abort();
  }, [request]);
  return (
    <>
      <label>
        Buscar cliente
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={160}
          placeholder="Escribe el nombre para buscar…"
        />
      </label>
      <button
        type="button"
        className="secondary"
        disabled={busy}
        onClick={() => setRequest({ q: search.trim() })}
      >
        {busy ? "Buscando…" : "Buscar clientes"}
      </button>
      <label>
        Cliente
        <select
          value={value}
          onFocus={() => setRequest((current) => current ?? { q: "" })}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Sin asignar</option>
          {value && !clients.some((c) => c.id === value) && (
            <option value={value}>
              {initialName || "Cliente seleccionado"}
            </option>
          )}
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.business_name}
            </option>
          ))}
        </select>
        <span className="field-help">
          Busca por nombre y pulsa Buscar clientes. Hasta 25 resultados.{" "}
          <Link href={value ? "/admin/clientes/" + value : "/admin/clientes"}>
            Administrar clientes
          </Link>
        </span>
      </label>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
