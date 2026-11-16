"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="public-page">
      <div className="panel">
        <h1>No pudimos cargar esta página.</h1>
        <p>Comprueba la conexión y la configuración de Supabase.</p>
        <button onClick={reset}>Volver a intentar</button>
      </div>
    </main>
  );
}
