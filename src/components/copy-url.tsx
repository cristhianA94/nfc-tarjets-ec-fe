"use client";
import { useState } from "react";
import { Icon } from "./icon";
export function CopyUrl({ url }: { url: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("URL copiada");
    } catch {
      setMessage("Selecciona y copia la URL manualmente.");
    }
  }
  return (
    <div className="copy-group">
      <div className="copy-row">
        <input
          aria-label="URL permanente NFC"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
        />
        <button type="button" className="button secondary" onClick={copy}>
          <Icon name="copy" size={16} />
          Copiar
        </button>
      </div>
      <span className="copy-feedback" role="status">
        {message}
      </span>
    </div>
  );
}
