import Image from "next/image";
export function Brand() {
  return (
    <span className="brand">
      <Image
        className="brand-logo"
        src="/android-chrome-192x192.png"
        alt=""
        width={48}
        height={48}
        unoptimized
      />
      <span>
        <span className="brand-wordmark">
          Nex<span>Tap</span>
        </span>
        <span className="brand-sub">GESTIÓN DE TARJETAS</span>
      </span>
    </span>
  );
}
