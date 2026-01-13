// =====================================================
// FAQ Page
// =====================================================

export async function renderFaq(container) {
    container.innerHTML = `
    <div class="static-page">
        <div class="container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-question-circle"></i>
                    Preguntas Frecuentes
                </h1>
                <p class="page-subtitle">Encuentra respuestas a las preguntas más comunes</p>
            </div>

            <div class="faq-list">
                <div class="faq-item">
                    <button class="faq-question">
                        <span>¿Cómo puedo registrarme en un torneo?</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="faq-answer">
                        <p>Para registrarte en un torneo:</p>
                        <ol>
                            <li>Crea una cuenta o inicia sesión</li>
                            <li>Navega a la sección de Torneos</li>
                            <li>Selecciona el torneo de tu interés</li>
                            <li>Crea un equipo o únete a uno existente</li>
                            <li>Confirma tu inscripción</li>
                        </ol>
                    </div>
                </div>

                <div class="faq-item">
                    <button class="faq-question">
                        <span>¿Cuántos jugadores necesito para un equipo?</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="faq-answer">
                        <p>El número de jugadores depende del juego y torneo específico. Generalmente:</p>
                        <ul>
                            <li>FIFA / FC: 1 jugador (1v1)</li>
                            <li>Call of Duty: 4-6 jugadores</li>
                            <li>Valorant / CS2: 5 jugadores</li>
                        </ul>
                        <p>Revisa los requisitos específicos en la descripción de cada torneo.</p>
                    </div>
                </div>

                <div class="faq-item">
                    <button class="faq-question">
                        <span>¿Cómo funcionan los brackets de eliminación?</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="faq-answer">
                        <p>Utilizamos varios formatos de torneo:</p>
                        <ul>
                            <li><strong>Eliminación Simple:</strong> Una derrota y quedas eliminado</li>
                            <li><strong>Eliminación Doble:</strong> Tienes una segunda oportunidad en el bracket inferior</li>
                            <li><strong>Round Robin:</strong> Todos juegan contra todos</li>
                            <li><strong>Sistema Suizo:</strong> Emparejamiento basado en rendimiento</li>
                        </ul>
                    </div>
                </div>

                <div class="faq-item">
                    <button class="faq-question">
                        <span>¿Cómo se reportan los resultados de las partidas?</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="faq-answer">
                        <p>Después de cada partida:</p>
                        <ol>
                            <li>El capitán del equipo ganador reporta el resultado</li>
                            <li>Sube una captura de pantalla como evidencia</li>
                            <li>El equipo contrario confirma el resultado</li>
                            <li>Los administradores validan si es necesario</li>
                        </ol>
                    </div>
                </div>

                <div class="faq-item">
                    <button class="faq-question">
                        <span>¿Hay premios en los torneos?</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="faq-answer">
                        <p>Sí, muchos torneos incluyen premios. El pool de premios se muestra en la página de cada torneo. Los premios pueden incluir:</p>
                        <ul>
                            <li>Dinero en efectivo</li>
                            <li>Gift cards</li>
                            <li>Merchandise exclusivo</li>
                            <li>Puntos de ranking</li>
                        </ul>
                    </div>
                </div>

                <div class="faq-item">
                    <button class="faq-question">
                        <span>¿Qué pasa si no puedo jugar mi partida?</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="faq-answer">
                        <p>Si no puedes asistir a una partida programada:</p>
                        <ol>
                            <li>Contacta a los organizadores con anticipación</li>
                            <li>Intenta acordar un nuevo horario con tu oponente</li>
                            <li>Si no te presentas, podrías recibir una derrota por default</li>
                        </ol>
                        <p>Revisa las reglas específicas de cada torneo para más detalles.</p>
                    </div>
                </div>
            </div>

            <div class="faq-contact">
                <h2>¿No encontraste tu respuesta?</h2>
                <p>Contacta a nuestro equipo de soporte</p>
                <a href="#/contacto" class="btn btn-primary">
                    <i class="fas fa-envelope"></i>
                    Contactar Soporte
                </a>
            </div>
        </div>
    </div>
    `;

    initFaqEvents();
}

function initFaqEvents() {
    const questions = document.querySelectorAll('.faq-question');

    questions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const isOpen = item.classList.contains('open');

            // Close all other items
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

            // Toggle current item
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });
}
