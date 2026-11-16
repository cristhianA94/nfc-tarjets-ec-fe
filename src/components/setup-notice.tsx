import { Brand } from "./brand";
export function SetupNotice() {
  return (
    <main className="public-page">
      <div className="panel setup">
        <Brand />
        <span className="eyebrow">CONFIGURACIÓN INICIAL</span>
        <h1>Conecta tu proyecto de Supabase.</h1>
        <p>
          Configura las tres variables de <code>.env.example</code> en{" "}
          <code>.env.local</code>, aplica la migración del repositorio backend y
          crea el administrador siguiendo el README.
        </p>
        <p>
          Después, reinicia el servidor. No se han cargado datos de demostración
          ni credenciales.
        </p>
      </div>
    </main>
  );
}
