import { Icon } from "./icon";
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Icon name="signal" size={23} />
      </span>
      <span>
        NFC<span className="brand-sub">GESTIÓN DE TARJETAS</span>
      </span>
    </span>
  );
}
