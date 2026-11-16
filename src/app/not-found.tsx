import Link from "next/link";
export default function NotFound() {
  return (
    <main className="public-page">
      <div className="public-content">
        <span className="eyebrow">404 · NexTap</span>
        <h1>No encontramos esta tarjeta.</h1>
        <p>
          Comprueba el código o contacta con la persona que te entregó la
          tarjeta.
        </p>
        <Link className="button secondary" href="/demo">
          Ver cómo funciona
        </Link>
      </div>
    </main>
  );
}
