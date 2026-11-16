import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";
export default function DemoPage() {
  return (
    <main className="demo-page">
      <header className="public-header">
        <Brand />
        <span className="demo-tag">DEMOSTRACIÓN</span>
      </header>
      <section className="demo-hero">
        <div>
          <span className="eyebrow">EL SIGUIENTE PASO, A UN TOQUE</span>
          <h1>
            Consigue más
            <br />
            reseñas en <span>Google.</span>
          </h1>
          <p>
            Acerca el celular a la tarjeta NFC y abre el enlace de reseñas de tu
            negocio. Una forma sencilla de invitar a tus clientes a compartir su
            experiencia.
          </p>
          <div className="demo-note">
            <span className="status-dot" />
            Esta tarjeta está disponible para activar.
          </div>
          <p className="small muted">
            Solicita información a la persona que te mostró esta tarjeta.
          </p>
        </div>
        <div className="demo-visual" aria-hidden="true">
          <div className="physical-card">
            <Icon name="signal" size={54} />
            <span className="physical-label">
              TU EXPERIENCIA
              <br />
              CUENTA.
            </span>
            <div className="physical-line" />
            <small>
              ACERCA TU CELULAR
              <br />Y COMPARTE TU OPINIÓN
            </small>
          </div>
          <span className="visual-caption">Una conexión sin contacto.</span>
        </div>
      </section>
      <section className="benefit-grid">
        <article>
          <span>01</span>
          <h2>Sin escribir enlaces</h2>
          <p>
            El NFC abre la dirección programada al acercar un teléfono
            compatible.
          </p>
        </article>
        <article>
          <span>02</span>
          <h2>Directo a tus reseñas</h2>
          <p>
            Una tarjeta activa dirige al enlace de Google configurado para el
            negocio.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>Un destino actualizable</h2>
          <p>
            El administrador puede cambiar el enlace sin reprogramar el chip.
          </p>
        </article>
      </section>
      <footer className="public-footer">
        NexTap · Conecta con la experiencia de tus clientes.
      </footer>
    </main>
  );
}
