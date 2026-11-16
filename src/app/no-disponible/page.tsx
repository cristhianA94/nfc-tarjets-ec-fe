import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";
export default function Unavailable() {
  return (
    <main className="public-page">
      <div className="panel unavailable">
        <Brand />
        <div className="detail-icon">
          <Icon name="signal" size={40} />
        </div>
        <span className="eyebrow">TARJETA SUSPENDIDA</span>
        <h1>No disponible temporalmente.</h1>
        <p>
          Esta tarjeta no está activa en este momento. Contacta con el negocio
          para obtener más información.
        </p>
      </div>
    </main>
  );
}
