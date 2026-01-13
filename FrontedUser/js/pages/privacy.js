// =====================================================
// Privacy Policy Page
// =====================================================

export async function renderPrivacy(container) {
    container.innerHTML = `
    <div class="static-page legal-page">
        <div class="container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-shield-alt"></i>
                    Política de Privacidad
                </h1>
                <p class="page-subtitle">Última actualización: Enero 2026</p>
            </div>

            <div class="legal-content">
                <section>
                    <h2>1. Información que Recopilamos</h2>
                    <p>Recopilamos información que nos proporcionas directamente:</p>
                    <ul>
                        <li><strong>Datos de cuenta:</strong> nombre de usuario, correo electrónico, contraseña</li>
                        <li><strong>Perfil:</strong> avatar, biografía, cuentas de juego vinculadas</li>
                        <li><strong>Participación:</strong> equipos, torneos, partidas, resultados</li>
                        <li><strong>Comunicaciones:</strong> mensajes de soporte, reportes</li>
                    </ul>
                </section>

                <section>
                    <h2>2. Uso de la Información</h2>
                    <p>Utilizamos tu información para:</p>
                    <ul>
                        <li>Proporcionar y mejorar nuestros servicios</li>
                        <li>Gestionar torneos y partidas</li>
                        <li>Enviar notificaciones sobre tus actividades</li>
                        <li>Prevenir fraude y mantener la seguridad</li>
                        <li>Comunicar actualizaciones importantes</li>
                    </ul>
                </section>

                <section>
                    <h2>3. Compartir Información</h2>
                    <p>No vendemos tu información personal. Podemos compartirla con:</p>
                    <ul>
                        <li>Otros usuarios (nombre de usuario, estadísticas públicas)</li>
                        <li>Organizadores de torneos (participantes de sus torneos)</li>
                        <li>Proveedores de servicios que nos ayudan a operar</li>
                        <li>Autoridades cuando sea requerido por ley</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Seguridad</h2>
                    <p>Implementamos medidas de seguridad para proteger tus datos:</p>
                    <ul>
                        <li>Encriptación de contraseñas con bcrypt</li>
                        <li>Conexiones seguras (HTTPS)</li>
                        <li>Acceso restringido a datos sensibles</li>
                        <li>Monitoreo de actividad sospechosa</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Tus Derechos</h2>
                    <p>Tienes derecho a:</p>
                    <ul>
                        <li>Acceder a tus datos personales</li>
                        <li>Corregir información incorrecta</li>
                        <li>Solicitar la eliminación de tu cuenta</li>
                        <li>Exportar tus datos</li>
                        <li>Retirar tu consentimiento</li>
                    </ul>
                </section>

                <section>
                    <h2>6. Cookies</h2>
                    <p>Utilizamos cookies y tecnologías similares para:</p>
                    <ul>
                        <li>Mantener tu sesión iniciada</li>
                        <li>Recordar tus preferencias</li>
                        <li>Analizar el uso del sitio</li>
                    </ul>
                </section>

                <section>
                    <h2>7. Menores de Edad</h2>
                    <p>Nuestro servicio está dirigido a personas mayores de 16 años. No recopilamos intencionalmente información de menores de esta edad.</p>
                </section>

                <section>
                    <h2>8. Cambios a esta Política</h2>
                    <p>Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos a través de la plataforma o por correo electrónico.</p>
                </section>

                <section>
                    <h2>9. Contacto</h2>
                    <p>Si tienes preguntas sobre esta política, contáctanos:</p>
                    <p><a href="#/contacto">Formulario de Contacto</a></p>
                </section>
            </div>
        </div>
    </div>
    `;
}
