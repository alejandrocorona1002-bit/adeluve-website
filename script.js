// ============================================================
// ADELuve — configuración general
// ============================================================

// 1) Pega aquí los datos de tu proyecto Supabase.
// Usa solamente la Project URL y la Publishable key / anon public key.
// NUNCA pongas aquí una service_role key ni una secret key.
const SUPABASE_URL = "https://mwwggiqcguxgfdzioske.supabase.co";
const SUPABASE_KEY = "sb_publishable_mY5PqPN43N2ZBGGZo6uKRg_4K9sczjY";

// 2) Datos públicos de ADELuve. Déjalos vacíos hasta tener los reales.
const CONTACT = {
  phone: "",
  email: "",
  location: ""
};

// ============================================================
// Utilidades
// ============================================================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const isSupabaseConfigured =
  SUPABASE_URL &&
  SUPABASE_KEY &&
  !SUPABASE_URL.includes("PEGA_AQUI") &&
  !SUPABASE_KEY.includes("PEGA_AQUI");

let supabaseClient = null;

if (isSupabaseConfigured && window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ============================================================
// Menú móvil
// ============================================================
const menuBtn = $(".menu-toggle");
const nav = $(".nav");

menuBtn?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});

$$(".nav a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
  })
);

// ============================================================
// Animaciones al hacer scroll
// ============================================================
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  $$(".reveal").forEach((el) => io.observe(el));
} else {
  $$(".reveal").forEach((el) => el.classList.add("visible"));
}

// ============================================================
// Año del footer
// ============================================================
const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

// ============================================================
// Datos públicos de contacto de ADELuve
// ============================================================
const contactData = $("#contact-data");

const publicContactItems = [
  ["Tel. / WhatsApp", CONTACT.phone],
  ["Correo", CONTACT.email],
  ["Ubicación / cobertura", CONTACT.location]
].filter(([, value]) => value?.trim());

if (contactData && publicContactItems.length) {
  contactData.innerHTML = publicContactItems
    .map(
      ([label, value]) =>
        `<div class="contact-item"><b>${label}:</b><span>${value}</span></div>`
    )
    .join("");
}

// ============================================================
// Formulario de contacto → Supabase
// ============================================================
const contactForm = $("#contact-form");
const status = $("#form-status");
const submitButton = $("#submit-contact");

function setFormStatus(message, type = "") {
  if (!status) return;
  status.textContent = message;
  status.classList.remove("success", "error");
  if (type) status.classList.add(type);
}

function normalize(value) {
  return String(value ?? "").trim();
}

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);

  // Campo trampa básico contra bots. Los usuarios reales nunca lo ven.
  if (normalize(formData.get("sitio_web"))) {
    contactForm.reset();
    setFormStatus("Solicitud enviada correctamente.", "success");
    return;
  }

  const payload = {
    nombre: normalize(formData.get("nombre")),
    empresa: normalize(formData.get("empresa")) || null,
    correo: normalize(formData.get("correo")),
    telefono: normalize(formData.get("telefono")) || null,
    servicio: normalize(formData.get("servicio")) || null,
    mensaje: normalize(formData.get("mensaje")),
    estatus: "Nuevo"
  };

  if (!payload.nombre || !payload.correo || !payload.mensaje) {
    setFormStatus("Completa nombre, correo y descripción antes de enviar.", "error");
    return;
  }

  if (!supabaseClient) {
    console.error("Supabase no está configurado. Revisa SUPABASE_URL y SUPABASE_KEY.");
    setFormStatus(
      "El formulario todavía no está conectado. Revisa la configuración de Supabase.",
      "error"
    );
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";
  setFormStatus("Enviando solicitud...");

  try {
    const { error } = await supabaseClient
      .from("contactos")
      .insert([payload]);

    if (error) throw error;

    contactForm.reset();
    setFormStatus(
      "Solicitud enviada correctamente. Gracias por contactar a ADELuve.",
      "success"
    );
  } catch (error) {
    console.error("Error al guardar el contacto en Supabase:", error);
    setFormStatus(
      "No fue posible enviar la solicitud. Intenta nuevamente en unos momentos.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar solicitud";
  }
});
