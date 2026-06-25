import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const runtime = "edge";
export const alt = "PromoDetec - ofertas verificadas em tecnologia, beleza e mais";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const categorias = ["Hardware", "Smartphones", "Smartwatches", "Gadgets", "Perfumes", "Skincare", "Cabelo"];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          background: "#07090c",
          color: "#f8fafc",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 82% 18%, rgba(34, 197, 94, 0.34), transparent 32%), radial-gradient(circle at 12% 82%, rgba(250, 204, 21, 0.2), transparent 26%), linear-gradient(135deg, #07110d 0%, #071018 48%, #111827 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -140,
            top: -130,
            width: 520,
            height: 520,
            border: "2px solid rgba(74, 222, 128, 0.36)",
            borderRadius: 999,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 36,
            top: 88,
            width: 250,
            height: 250,
            border: "2px solid rgba(250, 204, 21, 0.28)",
            borderRadius: 999,
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "58px 70px 54px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 82,
                height: 82,
                borderRadius: 24,
                background: "linear-gradient(135deg, #16a34a, #bef264)",
                color: "#052e16",
                fontSize: 42,
                fontWeight: 900,
              }}
            >
              %
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: -1 }}>{SITE_NAME}</div>
              <div style={{ color: "#a7f3d0", fontSize: 22, fontWeight: 700 }}>Detecte. Compare. Economize.</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 850 }}>
            <div style={{ color: "#facc15", fontSize: 26, fontWeight: 800, marginBottom: 14 }}>
              Ofertas verificadas em várias categorias
            </div>
            <div style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.02, letterSpacing: -1.2 }}>
              Promoções reais para tecnologia, beleza e compras do dia a dia.
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 25, lineHeight: 1.35, marginTop: 22 }}>
              {SITE_DESCRIPTION}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {categorias.map((categoria) => (
              <div
                key={categoria}
                style={{
                  border: "1px solid rgba(74, 222, 128, 0.4)",
                  borderRadius: 999,
                  background: "rgba(15, 23, 42, 0.7)",
                  color: "#dcfce7",
                  fontSize: 21,
                  fontWeight: 800,
                  padding: "12px 18px",
                }}
              >
                {categoria}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
