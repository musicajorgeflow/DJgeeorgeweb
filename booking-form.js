(() => {
  const form = document.querySelector("#booking-form");
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const message = [
      "Hola DJgeeorge, quiero consultar disponibilidad para un evento:",
      `Fecha: ${data.get("fecha")}`,
      `Ciudad: ${data.get("ciudad")}`,
      `Tipo de evento: ${data.get("evento")}`
    ].join("\n");
    window.open(`https://wa.me/34622090492?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  });
})();
