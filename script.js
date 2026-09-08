// Completa estos datos cuando estén definidos.
const CONTACT = {
  phone: "",
  email: "",
  location: ""
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const menuBtn = $(".menu-toggle");
const nav = $(".nav");
menuBtn?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
$$('.nav a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuBtn?.setAttribute('aria-expanded', 'false');
}));

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
$$('.reveal').forEach(el => io.observe(el));

$("#year").textContent = new Date().getFullYear();

const contactData = $("#contact-data");
const contactNote = $("#contact-note");
const items = [
  ["Tel. / WhatsApp", CONTACT.phone],
  ["Correo", CONTACT.email],
  ["Ubicación / cobertura", CONTACT.location]
].filter(([,value]) => value?.trim());

if (items.length) {
  contactData.innerHTML = items.map(([label, value]) =>
    `<div class="contact-item"><b>${label}:</b><span>${value}</span></div>`
  ).join('');
  contactNote.hidden = true;
}

$("#contact-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const text = [
    "Solicitud de contacto — ADELuve",
    `Nombre: ${data.nombre || ''}`,
    `Empresa: ${data.empresa || ''}`,
    `Correo: ${data.correo || ''}`,
    "",
    "Necesidad / proyecto:",
    data.mensaje || ''
  ].join('\n');

  const status = $("#form-status");
  if (CONTACT.email) {
    const subject = encodeURIComponent('Solicitud de contacto — ADELuve');
    const body = encodeURIComponent(text);
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    status.textContent = 'Se abrió tu aplicación de correo con la solicitud preparada.';
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    status.textContent = 'Solicitud copiada. Los datos de contacto de ADELuve aún están por definir.';
  } catch {
    status.textContent = 'Los datos de contacto de ADELuve aún están por definir. Configúralos en script.js.';
  }
});
