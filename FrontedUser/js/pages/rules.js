// =====================================================
// Rules Page
// =====================================================

export async function renderRules(container) {
    container.innerHTML = `
    <div class="static-page">
        <div class="container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-gavel"></i>
                    Reglas Generales
                </h1>
                <p class="page-subtitle">Reglas aplicables a todos los torneos de ApexTournament</p>
            </div>

            <div class="rules-content">
                <section class="rules-section">
                    <h2><i class="fas fa-user-check"></i> 1. Elegibilidad</h2>
                    <ul>
                        <li>Debes tener al menos 16 años para participar</li>
                        <li>Una cuenta por persona - No se permiten cuentas múltiples</li>
                        <li>Debes usar tu cuenta personal del juego</li>
                        <li>Los jugadores deben residir en la región del torneo (si aplica)</li>
                    </ul>
                </section>

                <section class="rules-section">
                    <h2><i class="fas fa-users"></i> 2. Equipos</h2>
                    <ul>
                        <li>Los equipos deben tener el número mínimo de jugadores requerido</li>
                        <li>Un jugador solo puede estar en un equipo por torneo</li>
                        <li>Los cambios de roster deben notificarse a los organizadores</li>
                        <li>No se permiten cambios de roster una vez iniciado el bracket</li>
                    </ul>
                </section>

                <section class="rules-section">
                    <h2><i class="fas fa-gamepad"></i> 3. Partidas</h2>
                    <ul>
                        <li>Los jugadores deben estar listos 15 minutos antes del horario programado</li>
                        <li>Se toleran máximo 10 minutos de retraso, después se otorga la victoria por default</li>
                        <li>Las pausas están limitadas a 5 minutos por equipo por partida</li>
                        <li>Las desconexiones se manejan según las reglas específicas del juego</li>
                    </ul>
                </section>

                <section class="rules-section">
                    <h2><i class="fas fa-ban"></i> 4. Conducta Prohibida</h2>
                    <ul>
                        <li>Uso de hacks, cheats o software no autorizado</li>
                        <li>Amaño de partidas o resultados</li>
                        <li>Acoso, insultos o comportamiento tóxico</li>
                        <li>Suplantación de identidad</li>
                        <li>Compartir cuentas o boosting</li>
                    </ul>
                </section>

                <section class="rules-section">
                    <h2><i class="fas fa-clipboard-check"></i> 5. Reportar Resultados</h2>
                    <ul>
                        <li>El equipo ganador debe reportar el resultado en 15 minutos</li>
                        <li>Incluye capturas de pantalla como evidencia</li>
                        <li>Disputas deben reportarse dentro de las 24 horas</li>
                        <li>La decisión de los administradores es final</li>
                    </ul>
                </section>

                <section class="rules-section">
                    <h2><i class="fas fa-trophy"></i> 6. Premios</h2>
                    <ul>
                        <li>Los premios se distribuyen dentro de 30 días después del torneo</li>
                        <li>Los ganadores deben proporcionar información válida para el pago</li>
                        <li>Los impuestos son responsabilidad del ganador</li>
                        <li>Descalificación = pérdida del derecho a premios</li>
                    </ul>
                </section>

                <section class="rules-section">
                    <h2><i class="fas fa-exclamation-triangle"></i> 7. Sanciones</h2>
                    <div class="sanctions-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Infracción</th>
                                    <th>Sanción</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Lenguaje inapropiado leve</td>
                                    <td>Advertencia</td>
                                </tr>
                                <tr>
                                    <td>Retraso sin justificación</td>
                                    <td>Derrota por default</td>
                                </tr>
                                <tr>
                                    <td>Conducta antideportiva</td>
                                    <td>Descalificación del torneo</td>
                                </tr>
                                <tr>
                                    <td>Uso de cheats/hacks</td>
                                    <td>Ban permanente</td>
                                </tr>
                                <tr>
                                    <td>Amaño de partidas</td>
                                    <td>Ban permanente + reporte</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <div class="rules-footer">
                    <p><strong>Última actualización:</strong> Enero 2026</p>
                    <p>Estas reglas están sujetas a cambios. Revisa periódicamente para actualizaciones.</p>
                </div>
            </div>
        </div>
    </div>
    `;
}
