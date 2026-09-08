// ============================================================
// ADELUUVE — configuración general
// ============================================================

// 1) Pega aquí los datos de tu proyecto Supabase.
// IMPORTANTE: la URL debe terminar en .supabase.co (sin /rest/v1).
// Usa solamente la Project URL y la Publishable key / anon public key.
// NUNCA pongas aquí una service_role key ni una secret key.
const SUPABASE_URL = "https://mwwggiqcguxgfdzioske.supabase.co";
const SUPABASE_KEY = "sb_publishable_mY5PqPN43N2ZBGGZo6uKRg_4K9sczjY";

// 2) Datos públicos de ADELUUVE. Déjalos vacíos hasta tener los reales.
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
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL.replace(/\/+$/, ""),
    SUPABASE_KEY
  );
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  }[char]));
}

function normalize(value) {
  return String(value ?? "").trim();
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
$$('.nav a').forEach((a) => a.addEventListener("click", () => {
  nav.classList.remove("open");
  menuBtn?.setAttribute("aria-expanded", "false");
}));

// ============================================================
// Animaciones al hacer scroll
// ============================================================
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
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
// Datos públicos de contacto
// ============================================================
const contactData = $("#contact-data");
const publicContactItems = [
  ["Tel. / WhatsApp", CONTACT.phone],
  ["Correo", CONTACT.email],
  ["Ubicación / cobertura", CONTACT.location]
].filter(([, value]) => value?.trim());

if (contactData && publicContactItems.length) {
  contactData.innerHTML = publicContactItems
    .map(([label, value]) => `<div class="contact-item"><b>${escapeHtml(label)}:</b><span>${escapeHtml(value)}</span></div>`)
    .join("");
}

// ============================================================
// Formulario de contacto → Supabase
// Tabla: contactos
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

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);

  // Campo trampa contra bots.
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
    setFormStatus("El formulario todavía no está conectado. Revisa la configuración de Supabase.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";
  setFormStatus("Enviando solicitud...");

  try {
    const { error } = await supabaseClient.from("contactos").insert([payload]);
    if (error) throw error;
    contactForm.reset();
    setFormStatus("Solicitud enviada correctamente. Gracias por contactar a ADELUUVE.", "success");
  } catch (error) {
    console.error("Error al guardar el contacto en Supabase:", error);
    setFormStatus("No fue posible enviar la solicitud. Intenta nuevamente en unos momentos.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar solicitud";
  }
});

// ============================================================
// Proyectos → Supabase
// Tabla principal: proyectos
// Opcional para múltiples imágenes: proyecto_imagenes
// ============================================================
const projectsGrid = $("#projects-grid");
const projectFilters = $$(".project-filter");
let allProjects = [];

async function attachProjectImages(projects) {
  if (!supabaseClient || !projects.length) return projects;

  // Si todavía no creaste proyecto_imagenes, la web seguirá usando imagen_url.
  try {
    const ids = projects.map((p) => p.id).filter(Boolean);
    const { data, error } = await supabaseClient
      .from("proyecto_imagenes")
      .select("id,proyecto_id,imagen_url,orden,created_at")
      .in("proyecto_id", ids)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    const grouped = new Map();
    (data || []).forEach((img) => {
      if (!grouped.has(img.proyecto_id)) grouped.set(img.proyecto_id, []);
      if (img.imagen_url) grouped.get(img.proyecto_id).push(img.imagen_url);
    });

    return projects.map((project) => {
      const extras = grouped.get(project.id) || [];
      const images = [project.imagen_url, ...extras].filter(Boolean);
      return { ...project, imagenes: [...new Set(images)] };
    });
  } catch (error) {
    console.info("proyecto_imagenes todavía no está disponible; se usará imagen_url.", error?.message || error);
    return projects.map((project) => ({
      ...project,
      imagenes: project.imagen_url ? [project.imagen_url] : []
    }));
  }
}

function renderProjects(items) {
  if (!projectsGrid) return;
  if (!items.length) {
    projectsGrid.innerHTML = '<div class="projects-empty">Todavía no hay proyectos publicados.</div>';
    return;
  }

  projectsGrid.innerHTML = items.map((project, index) => {
    const image = project.imagenes?.[0] || project.imagen_url || "";
    const totalImages = project.imagenes?.length || (image ? 1 : 0);
    return `
      <article class="project-card reveal visible" data-project-index="${index}">
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(project.titulo || 'Proyecto ADELUUVE')}" loading="lazy" />` : '<div class="project-no-image">ADELUUVE</div>'}
        ${totalImages > 1 ? `<div class="project-photo-count">${totalImages} fotos</div>` : ''}
        <div class="project-card-copy">
          <span>${escapeHtml(project.tipo || 'Proyecto')}</span>
          <h3>${escapeHtml(project.titulo || 'Trabajo realizado')}</h3>
          ${project.descripcion ? `<p>${escapeHtml(project.descripcion)}</p>` : ''}
        </div>
      </article>`;
  }).join("");

  $$(".project-card", projectsGrid).forEach((card) => {
    card.addEventListener("click", () => openProjectModal(items[Number(card.dataset.projectIndex)]));
  });
}

async function loadProjects() {
  if (!projectsGrid) return;
  if (!supabaseClient) {
    projectsGrid.innerHTML = '<div class="projects-empty">Configura Supabase para mostrar tus proyectos.</div>';
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("proyectos")
      .select("id,titulo,descripcion,imagen_url,tipo,publicado,created_at")
      .eq("publicado", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    allProjects = await attachProjectImages(data || []);
    renderProjects(allProjects);
  } catch (error) {
    console.error("Error al cargar proyectos:", error);
    projectsGrid.innerHTML = '<div class="projects-empty">No fue posible cargar los proyectos en este momento.</div>';
  }
}

projectFilters.forEach((button) => {
  button.addEventListener("click", () => {
    projectFilters.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    const filter = button.dataset.filter;
    const items = filter === "todos"
      ? allProjects
      : allProjects.filter((p) => String(p.tipo || "").toLowerCase() === filter);
    renderProjects(items);
  });
});

// ============================================================
// Modal / carrusel de imágenes del proyecto
// ============================================================
const projectModal = $("#project-modal");
const projectModalClose = $("#project-modal-close");
const modalPrev = $("#project-modal-prev");
const modalNext = $("#project-modal-next");
const modalCounter = $("#project-modal-counter");
let currentProjectImages = [];
let currentProjectImageIndex = 0;

function updateModalImage() {
  const img = $("#project-modal-image");
  if (!img) return;
  const src = currentProjectImages[currentProjectImageIndex] || "";
  img.src = src;

  const multiple = currentProjectImages.length > 1;
  modalPrev?.classList.toggle("show", multiple);
  modalNext?.classList.toggle("show", multiple);
  if (modalCounter) {
    modalCounter.textContent = multiple
      ? `${currentProjectImageIndex + 1} / ${currentProjectImages.length}`
      : "";
  }
}

function openProjectModal(project) {
  if (!projectModal || !project) return;
  currentProjectImages = project.imagenes?.length
    ? project.imagenes
    : (project.imagen_url ? [project.imagen_url] : []);
  currentProjectImageIndex = 0;

  $("#project-modal-image").alt = project.titulo || "Proyecto ADELUUVE";
  $("#project-modal-type").textContent = project.tipo || "Proyecto";
  $("#project-modal-title").textContent = project.titulo || "Trabajo realizado";
  $("#project-modal-description").textContent = project.descripcion || "";
  updateModalImage();

  projectModal.classList.add("open");
  projectModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeProjectModal() {
  if (!projectModal) return;
  projectModal.classList.remove("open");
  projectModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function nextModalImage(direction) {
  if (currentProjectImages.length < 2) return;
  currentProjectImageIndex = (currentProjectImageIndex + direction + currentProjectImages.length) % currentProjectImages.length;
  updateModalImage();
}

modalPrev?.addEventListener("click", (e) => { e.stopPropagation(); nextModalImage(-1); });
modalNext?.addEventListener("click", (e) => { e.stopPropagation(); nextModalImage(1); });
projectModalClose?.addEventListener("click", closeProjectModal);
projectModal?.addEventListener("click", (e) => { if (e.target === projectModal) closeProjectModal(); });
document.addEventListener("keydown", (e) => {
  if (!projectModal?.classList.contains("open")) return;
  if (e.key === "Escape") closeProjectModal();
  if (e.key === "ArrowLeft") nextModalImage(-1);
  if (e.key === "ArrowRight") nextModalImage(1);
});

loadProjects();
