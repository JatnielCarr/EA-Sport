// =====================================================
// Contact Page
// =====================================================

export async function renderContact(container) {
    container.innerHTML = `
    <div class="static-page">
        <div class="container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-envelope"></i>
                    Contacto
                </h1>
                <p class="page-subtitle">¿Tienes alguna pregunta? Escríbenos</p>
            </div>

            <div class="contact-grid">
                <div class="contact-form-section">
                    <form id="contactForm" class="contact-form">
                        <div class="form-group">
                            <label for="contactName">
                                <i class="fas fa-user"></i>
                                Nombre
                            </label>
                            <input type="text" id="contactName" name="name" placeholder="Tu nombre" required>
                        </div>

                        <div class="form-group">
                            <label for="contactEmail">
                                <i class="fas fa-envelope"></i>
                                Correo Electrónico
                            </label>
                            <input type="email" id="contactEmail" name="email" placeholder="tu@email.com" required>
                        </div>

                        <div class="form-group">
                            <label for="contactSubject">
                                <i class="fas fa-tag"></i>
                                Asunto
                            </label>
                            <select id="contactSubject" name="subject" required>
                                <option value="">Selecciona un asunto</option>
                                <option value="support">Soporte Técnico</option>
                                <option value="tournament">Consulta sobre Torneos</option>
                                <option value="account">Problema con mi Cuenta</option>
                                <option value="report">Reportar un Problema</option>
                                <option value="partnership">Colaboraciones</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="contactMessage">
                                <i class="fas fa-comment"></i>
                                Mensaje
                            </label>
                            <textarea id="contactMessage" name="message" rows="6" placeholder="Escribe tu mensaje aquí..." required></textarea>
                        </div>

                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fas fa-paper-plane"></i>
                            Enviar Mensaje
                        </button>
                    </form>
                </div>

                <div class="contact-info-section">
                    <div class="contact-card">
                        <div class="contact-icon">
                            <i class="fab fa-discord"></i>
                        </div>
                        <h3>Discord</h3>
                        <p>Únete a nuestra comunidad para soporte en tiempo real</p>
                        <a href="#" class="btn btn-outline">Unirse al Servidor</a>
                    </div>

                    <div class="contact-card">
                        <div class="contact-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <h3>Horario de Atención</h3>
                        <p>Lunes a Viernes: 10:00 - 20:00</p>
                        <p>Sábado y Domingo: 12:00 - 18:00</p>
                    </div>

                    <div class="contact-card">
                        <div class="contact-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <h3>Ubicación</h3>
                        <p>Ciudad de México, México</p>
                    </div>

                    <div class="social-links">
                        <h3>Síguenos</h3>
                        <div class="social-icons">
                            <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                            <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                            <a href="#" aria-label="Twitch"><i class="fab fa-twitch"></i></a>
                            <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    initContactForm();
}

function initContactForm() {
    const form = document.getElementById('contactForm');

    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const subject = document.getElementById('contactSubject').value;
        const message = document.getElementById('contactMessage').value;

        // For now, just show a success toast (no backend endpoint)
        window.showToast('success', '¡Mensaje enviado!', 'Te responderemos lo antes posible');
        form.reset();
    });
}
