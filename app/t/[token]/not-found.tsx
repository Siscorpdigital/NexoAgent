import { ORGANIZACION, RIF } from "@/lib/tarjetas/config";

export default function TarjetaNoDisponible() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg,#EEF4F2 0%,#F4F7F6 100%)" }}
    >
      <div className="max-w-sm w-full text-center bg-white rounded-2xl p-8" style={{ border: "1px solid #E5EDEB", boxShadow: "0 4px 18px rgba(45,87,80,.09)" }}>
        <div className="text-4xl mb-3">🪪</div>
        <h1 className="text-lg font-bold" style={{ color: "#2D5750" }}>
          Esta tarjeta no está disponible
        </h1>
        <p className="text-sm mt-2" style={{ color: "#5C7872" }}>
          El perfil fue desactivado o el código QR ya no es válido.
        </p>
        <a
          href="/"
          className="inline-block mt-6 text-sm font-semibold text-white px-5 py-2.5 rounded-xl"
          style={{ background: "linear-gradient(120deg,#2D5750,#2BAA8A)" }}
        >
          Ir a Previsión Familiar
        </a>
        <p className="text-[11px] mt-6" style={{ color: "#8FA69F" }}>
          {ORGANIZACION} · <span className="whitespace-nowrap">RIF: {RIF}</span>
        </p>
      </div>
    </div>
  );
}
