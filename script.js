// ============================================================
// ADELUUVE — CONFIGURACIÓN
// ============================================================
// Usa la Project URL (termina en .supabase.co) y la Publishable/anon key.
// NO uses service_role ni una secret key en este archivo público.
const SUPABASE_URL = "https://mwwggiqcguxgfdzioske.supabase.co";
const SUPABASE_KEY = "sb_publishable_mY5PqPN43N2ZBGGZo6uKRg_4K9sczjY";

// Datos públicos. Déjalos vacíos si todavía no están definidos.
const CONTACT = {
  phone: "",
  email: "",
  location: ""
};

// ============================================================
// UTILIDADES
// ============================================================
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const normalize = (value) => String(value ?? "").trim();

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
  }[char]));
}

function safeUrl(value = "") {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

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

// ============================================================
// HEADER, MENÚ Y PROGRESO DE PÁGINA
// ============================================================
const header = $(".site-header");
const menuBtn = $(".menu-toggle");
const nav = $(".nav");
const progressBar = $("#page-progress");

menuBtn?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});

$$('.nav a').forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
  });
});

function updateScrollUI() {
  const y = window.scrollY;
  header?.classList.toggle("scrolled", y > 12);

  if (progressBar) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percent = max > 0 ? (y / max) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }
}

window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();

// ============================================================
// ANIMACIONES REVEAL + METODOLOGÍA
// ============================================================
const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" })
  : null;

function observeReveals(context = document) {
  $$(".reveal", context).forEach((el) => {
    if (el.classList.contains("visible")) return;
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add("visible");
  });
}
observeReveals();

const methodology = $("#metodologia");
const trackProgress = $("#track-progress");
if (methodology && trackProgress && "IntersectionObserver" in window) {
  const methodObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        trackProgress.style.width = "100%";
        methodObserver.disconnect();
      }
    });
  }, { threshold: 0.35 });
  methodObserver.observe(methodology);
}

// ============================================================
// NAVEGACIÓN ACTIVA SEGÚN SECCIÓN
// ============================================================
const navLinks = $$(".nav a[href^='#']").filter((a) => !a.classList.contains("nav-cta"));
const sections = navLinks
  .map((a) => $(a.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
    });
  }, { threshold: [0.25, 0.45, 0.65], rootMargin: "-20% 0px -55% 0px" });
  sections.forEach((section) => sectionObserver.observe(section));
}

// ============================================================
// AÑO FOOTER
// ============================================================
const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

// ============================================================
// DATOS PÚBLICOS DE CONTACTO
// ============================================================
const contactData = $("#contact-data");
const publicContactItems = [
  ["Tel. / WhatsApp", CONTACT.phone],
  ["Correo", CONTACT.email],
  ["Ubicación / cobertura", CONTACT.location]
].filter(([, value]) => normalize(value));

if (contactData) {
  contactData.innerHTML = publicContactItems.length
    ? publicContactItems.map(([label, value]) => `
        <div class="contact-item">
          <b>${escapeHtml(label)}:</b>
          <span>${escapeHtml(value)}</span>
        </div>`).join("")
    : "";
}

// ============================================================
// FORMULARIO → SUPABASE / contactos
// ============================================================
const contactForm = $("#contact-form");
const formStatus = $("#form-status");
const submitButton = $("#submit-contact");

function setFormStatus(message, type = "") {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.remove("success", "error");
  if (type) formStatus.classList.add(type);
}

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);

  // Honeypot anti-bot
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
  submitButton.querySelector("span").textContent = "Enviando...";
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
    submitButton.querySelector("span").textContent = "Enviar solicitud";
  }
});

// ============================================================
// PROYECTOS → SUPABASE
// Tabla principal: proyectos
// Tabla opcional: proyecto_imagenes
// ============================================================
const projectsGrid = $("#projects-grid");
const projectFilters = $$(".project-filter");
let allProjects = [];
let activeFilter = "todos";

async function attachProjectImages(projects) {
  if (!supabaseClient || !projects.length) {
    return projects.map((project) => ({
      ...project,
      imagenes: safeUrl(project.imagen_url) ? [safeUrl(project.imagen_url)] : []
    }));
  }

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
    (data || []).forEach((image) => {
      const url = safeUrl(image.imagen_url);
      if (!url) return;
      if (!grouped.has(image.proyecto_id)) grouped.set(image.proyecto_id, []);
      grouped.get(image.proyecto_id).push(url);
    });

    return projects.map((project) => {
      const main = safeUrl(project.imagen_url);
      const extras = grouped.get(project.id) || [];
      return {
        ...project,
        imagenes: [...new Set([main, ...extras].filter(Boolean))]
      };
    });
  } catch (error) {
    console.info("proyecto_imagenes no disponible; se usará imagen_url.", error?.message || error);
    return projects.map((project) => {
      const main = safeUrl(project.imagen_url);
      return { ...project, imagenes: main ? [main] : [] };
    });
  }
}

function currentFilteredProjects() {
  if (activeFilter === "todos") return allProjects;
  return allProjects.filter((project) =>
    String(project.tipo || "").trim().toLowerCase() === activeFilter
  );
}

function renderProjects(items) {
  if (!projectsGrid) return;

  if (!items.length) {
    projectsGrid.innerHTML = '<div class="projects-empty">Todavía no hay proyectos publicados en esta categoría.</div>';
    return;
  }

  projectsGrid.innerHTML = items.map((project, index) => {
    const image = project.imagenes?.[0] || "";
    const totalImages = project.imagenes?.length || 0;
    const title = project.titulo || "Trabajo realizado";
    const description = project.descripcion || "";
    const type = project.tipo || "Proyecto";

    return `
      <article class="project-card reveal" data-project-id="${escapeHtml(project.id)}" data-index="${index}" tabindex="0" role="button" aria-label="Ver ${escapeHtml(title)}">
        ${image
          ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async" />`
          : '<div class="project-no-image">ADELUUVE</div>'}
        <span class="project-view">↗</span>
        ${totalImages > 1 ? `<span class="project-photo-count">${totalImages} fotos</span>` : ""}
        <div class="project-card-copy">
          <span>${escapeHtml(type)}</span>
          <h3>${escapeHtml(title)}</h3>
          ${description ? `<p>${escapeHtml(description)}</p>` : ""}
        </div>
      </article>`;
  }).join("");

  observeReveals(projectsGrid);
  requestAnimationFrame(() => {
    $$(".project-card", projectsGrid).forEach((card, index) => {
      card.style.transitionDelay = `${Math.min(index * 55, 260)}ms`;
    });
  });

  const filtered = items;
  $$(".project-card", projectsGrid).forEach((card) => {
    const open = () => openProjectModal(filtered[Number(card.dataset.index)]);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

async function loadProjects() {
  if (!projectsGrid) return;

  if (!supabaseClient) {
    projectsGrid.innerHTML = '<div class="projects-empty">Configura Supabase para mostrar aquí tus trabajos y proyectos.</div>';
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
    renderProjects(currentFilteredProjects());
  } catch (error) {
    console.error("Error al cargar proyectos:", error);
    projectsGrid.innerHTML = '<div class="projects-empty">No fue posible cargar los proyectos en este momento.</div>';
  }
}

projectFilters.forEach((button) => {
  button.addEventListener("click", () => {
    projectFilters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter || "todos";
    renderProjects(currentFilteredProjects());
  });
});

// ============================================================
// MODAL / CARRUSEL DE PROYECTOS
// ============================================================
const projectModal = $("#project-modal");
const projectModalClose = $("#project-modal-close");
const modalPrev = $("#project-modal-prev");
const modalNext = $("#project-modal-next");
const modalCounter = $("#project-modal-counter");
const modalImage = $("#project-modal-image");
const thumbs = $("#project-thumbs");
let currentProjectImages = [];
let currentProjectImageIndex = 0;
let lastFocusedElement = null;

function renderThumbs() {
  if (!thumbs) return;
  thumbs.innerHTML = currentProjectImages.map((src, index) => `
    <button class="project-thumb ${index === currentProjectImageIndex ? "active" : ""}" type="button" data-thumb-index="${index}" aria-label="Ver imagen ${index + 1}">
      <img src="${escapeHtml(src)}" alt="Miniatura ${index + 1}" loading="lazy" />
    </button>`).join("");

  $$(".project-thumb", thumbs).forEach((button) => {
    button.addEventListener("click", () => {
      currentProjectImageIndex = Number(button.dataset.thumbIndex);
      updateModalImage();
    });
  });
}

function updateModalImage() {
  if (!modalImage) return;
  const src = currentProjectImages[currentProjectImageIndex] || "";
  modalImage.src = src;

  const multiple = currentProjectImages.length > 1;
  modalPrev?.classList.toggle("show", multiple);
  modalNext?.classList.toggle("show", multiple);
  if (modalCounter) {
    modalCounter.textContent = multiple
      ? `${currentProjectImageIndex + 1} / ${currentProjectImages.length}`
      : "";
  }

  renderThumbs();
}

function openProjectModal(project) {
  if (!projectModal || !project) return;
  lastFocusedElement = document.activeElement;
  currentProjectImages = project.imagenes?.length
    ? project.imagenes
    : (safeUrl(project.imagen_url) ? [safeUrl(project.imagen_url)] : []);
  currentProjectImageIndex = 0;

  if (modalImage) modalImage.alt = project.titulo || "Proyecto ADELUUVE";
  $("#project-modal-type").textContent = project.tipo || "Proyecto";
  $("#project-modal-title").textContent = project.titulo || "Trabajo realizado";
  $("#project-modal-description").textContent = project.descripcion || "";

  updateModalImage();
  projectModal.classList.add("open");
  projectModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  projectModalClose?.focus();
}

function closeProjectModal() {
  if (!projectModal) return;
  projectModal.classList.remove("open");
  projectModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  lastFocusedElement?.focus?.();
}

function nextModalImage(direction) {
  if (currentProjectImages.length < 2) return;
  currentProjectImageIndex =
    (currentProjectImageIndex + direction + currentProjectImages.length) % currentProjectImages.length;
  updateModalImage();
}

modalPrev?.addEventListener("click", (event) => {
  event.stopPropagation();
  nextModalImage(-1);
});
modalNext?.addEventListener("click", (event) => {
  event.stopPropagation();
  nextModalImage(1);
});
projectModalClose?.addEventListener("click", closeProjectModal);
projectModal?.addEventListener("click", (event) => {
  if (event.target === projectModal) closeProjectModal();
});

document.addEventListener("keydown", (event) => {
  if (!projectModal?.classList.contains("open")) return;
  if (event.key === "Escape") closeProjectModal();
  if (event.key === "ArrowLeft") nextModalImage(-1);
  if (event.key === "ArrowRight") nextModalImage(1);
});

// Swipe básico en móvil
let touchStartX = 0;
projectModal?.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0]?.screenX || 0;
}, { passive: true });
projectModal?.addEventListener("touchend", (event) => {
  const endX = event.changedTouches[0]?.screenX || 0;
  const diff = endX - touchStartX;
  if (Math.abs(diff) > 55) nextModalImage(diff > 0 ? -1 : 1);
}, { passive: true });

loadProjects();
