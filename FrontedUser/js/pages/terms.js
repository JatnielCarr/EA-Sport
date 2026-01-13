// =====================================================
// Terms of Service Page
// =====================================================

export async function renderTerms(container) {
    container.innerHTML = `
    <div class="static-page legal-page">
        <div class="container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-file-contract"></i>
                    Términos de Servicio
                </h1>
                <p class="page-subtitle">Última actualización: Enero 2026</p>
            </div>

            <div class="legal-content">
                <section>
                    <h2>1. Aceptación de los Términos</h2>
                    <p>Al acceder o utilizar ApexTournament, aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar nuestros servicios.</p>
                </section>

                <section>
                    <h2>2. Descripción del Servicio</h2>
                    <p>ApexTournament es una plataforma de organización y gestión de torneos de esports que permite a los usuarios:</p>
                    <ul>
                        <li>Participar en torneos de videojuegos</li>
                        <li>Formar y gestionar equipos</li>
                        <li>Competir contra otros jugadores</li>
                        <li>Seguir estadísticas y rankings</li>
                    </ul>
                </section>

                <section>
                    <h2>3. Requisitos de la Cuenta</h2>
                    <ul>
                        <li>Debes tener al menos 16 años de edad</li>
                        <li>Debes proporcionar información precisa y actualizada</li>
                        <li>Eres responsable de mantener la confidencialidad de tu cuenta</li>
                        <li>Una persona solo puede tener una cuenta</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Conducta del Usuario</h2>
                    <p>Te comprometes a NO:</p>
                    <ul>
                        <li>Violar las reglas de los torneos</li>
                        <li>Usar software no autorizado (hacks, cheats, bots)</li>
                        <li>Acosar, intimidar o discriminar a otros usuarios</li>
                        <li>Publicar contenido ofensivo, ilegal o inapropiado</li>
                        <li>Intentar acceder a cuentas de otros usuarios</li>
                        <li>Manipular resultados o participar en amaños</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Torneos y Competencias</h2>
                    <ul>
                        <li>Cada torneo tiene sus propias reglas específicas</li>
                        <li>Las decisiones de los organizadores son finales</li>
                        <li>Los premios están sujetos a verificación</li>
                        <li>Nos reservamos el derecho de descalificar a participantes</li>
                    </ul>
                </section>

                <section>
                    <h2>6. Propiedad Intelectual</h2>
                    <p>Todo el contenido de ApexTournament, incluyendo diseño, código, logos y marca, es propiedad de ApexTournament o sus licenciantes. No puedes copiar, modificar o distribuir nuestro contenido sin autorización.</p>
                </section>

                <section>
                    <h2>7. Limitación de Responsabilidad</h2>
                    <p>ApexTournament se proporciona "tal cual". No garantizamos:</p>
                    <ul>
                        <li>Disponibilidad ininterrumpida del servicio</li>
                        <li>Ausencia de errores o bugs</li>
                        <li>Resultados específicos de participación</li>
                    </ul>
                    <p>No somos responsables por daños indirectos, incidentales o consecuentes.</p>
                </section>

                <section>
                    <h2>8. Terminación</h2>
                    <p>Podemos suspender o terminar tu cuenta si:</p>
                    <ul>
                        <li>Violas estos términos</li>
                        <li>Participas en actividades fraudulentas</li>
                        <li>Tu conducta afecta negativamente a otros usuarios</li>
                    </ul>
                </section>

                <section>
                    <h2>9. Modificaciones</h2>
                    <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor al publicarse en la plataforma. El uso continuado del servicio constituye aceptación de los nuevos términos.</p>
                </section>

                <section>
                    <h2>10. Ley Aplicable</h2>
                    <p>Estos términos se rigen por las leyes de México. Cualquier disputa será resuelta en los tribunales de la Ciudad de México.</p>
                </section>

                <section>
                    <h2>11. Contacto</h2>
                    <p>Para preguntas sobre estos términos:</p>
                    <p><a href="#/contacto">Contáctanos</a></p>
                </section>
            </div>
        </div>
    </div>
    `;
}
