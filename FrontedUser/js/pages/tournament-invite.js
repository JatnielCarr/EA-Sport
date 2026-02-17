// =====================================================
// Tournament Invite Page - Register via invite code
// =====================================================

import API from '../api.js';
import { showLoading, formatDate, formatCurrency } from '../ui-helpers.js';
import { isAuthenticated, getStoredUser } from '../auth.js';

export async function renderTournamentInvite(container, inviteCode) {
  showLoading(container);

  try {
    const response = await API.tournaments.getByInviteCode(inviteCode);
    const tournament = response.data;

    if (!tournament) {
      container.innerHTML = `
        <div class="container">
          <div class="empty-state">
            <i class="fas fa-link-slash"></i>
            <h3>Invitación no válida</h3>
            <p>El código de invitación no es válido o ha expirado.</p>
            <a href="#/torneos" class="btn btn-primary">Ver torneos</a>
          </div>
        </div>
      `;
      return;
    }

    const user = getStoredUser();
    const isLoggedIn = isAuthenticated();
    const spotsLeft = tournament.spots_left;
    const isFull = spotsLeft <= 0;
    const requiresPayment = tournament.requires_payment;

    container.innerHTML = `
      <div class="tournament-invite-page">
        <div class="container" style="max-width: 700px; margin: 0 auto; padding: 40px 20px;">
          
          <!-- Invite Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(0,212,255,0.1); padding: 8px 20px; border-radius: 50px; border: 1px solid rgba(0,212,255,0.3); margin-bottom: 16px;">
              <i class="fas fa-envelope-open-text" style="color: var(--primary);"></i>
              <span style="color: var(--primary); font-weight: 700; font-size: 12px; letter-spacing: 1px;">INVITACIÓN A TORNEO</span>
            </div>
            <h1 style="font-size: 28px; font-weight: 800; color: var(--text); margin-bottom: 8px;">
              ${tournament.name}
            </h1>
            <p style="color: var(--text-secondary); font-size: 14px;">
              Organizado por <strong>${tournament.organizer?.username || 'Admin'}</strong>
            </p>
          </div>

          <!-- Tournament Info Card -->
          <div style="background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <span style="color: var(--text-secondary); font-size: 12px; display: block;">Juego</span>
                <strong style="color: var(--text);">
                  <i class="fas fa-gamepad"></i> ${tournament.game?.name || 'N/A'}
                </strong>
              </div>
              <div>
                <span style="color: var(--text-secondary); font-size: 12px; display: block;">Fecha de Inicio</span>
                <strong style="color: var(--text);">
                  <i class="fas fa-calendar"></i> ${formatDate(tournament.start_date)}
                </strong>
              </div>
              <div>
                <span style="color: var(--text-secondary); font-size: 12px; display: block;">Formato</span>
                <strong style="color: var(--text);">
                  <i class="fas fa-sitemap"></i> ${formatTournamentFormat(tournament.format)}
                </strong>
              </div>
              <div>
                <span style="color: var(--text-secondary); font-size: 12px; display: block;">Región</span>
                <strong style="color: var(--text);">
                  <i class="fas fa-map-marker-alt"></i> ${tournament.region || 'Global'}
                </strong>
              </div>
              <div>
                <span style="color: var(--text-secondary); font-size: 12px; display: block;">Equipos</span>
                <strong style="color: var(--text);">
                  <i class="fas fa-users"></i> ${tournament.current_teams}/${tournament.max_participants}
                </strong>
              </div>
              <div>
                <span style="color: var(--text-secondary); font-size: 12px; display: block;">Lugares disponibles</span>
                <strong style="color: ${isFull ? 'var(--danger)' : 'var(--success)'};">
                  ${isFull ? 'COMPLETO' : `${spotsLeft} lugares`}
                </strong>
              </div>
            </div>

            ${tournament.prize_pool && Number(tournament.prize_pool) > 0 ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); text-align: center;">
                <span style="color: var(--text-secondary); font-size: 12px;">Premio Total</span>
                <div style="font-size: 24px; font-weight: 800; color: var(--warning);">
                  <i class="fas fa-coins"></i> ${formatCurrency(tournament.prize_pool)}
                </div>
              </div>
            ` : ''}

            ${requiresPayment ? `
              <div style="margin-top: 16px; padding: 12px; background: rgba(255,193,7,0.1); border: 1px solid rgba(255,193,7,0.3); border-radius: 8px; text-align: center;">
                <i class="fas fa-credit-card" style="color: var(--warning);"></i>
                <strong style="color: var(--warning);"> Cuota de inscripción: ${formatCurrency(tournament.entry_fee)}</strong>
                <p style="color: var(--text-secondary); font-size: 12px; margin-top: 4px;">
                  Deberás pagar esta cuota después del registro para confirmar tu lugar.
                </p>
              </div>
            ` : `
              <div style="margin-top: 16px; padding: 12px; background: rgba(0,200,83,0.1); border: 1px solid rgba(0,200,83,0.3); border-radius: 8px; text-align: center;">
                <i class="fas fa-check-circle" style="color: var(--success);"></i>
                <strong style="color: var(--success);"> Registro gratuito</strong>
              </div>
            `}
          </div>

          ${tournament.description ? `
            <div style="background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <h3 style="color: var(--text); margin-bottom: 8px;"><i class="fas fa-info-circle"></i> Descripción</h3>
              <p style="color: var(--text-secondary); line-height: 1.6;">${tournament.description}</p>
            </div>
          ` : ''}

          <!-- Registration Section -->
          ${isFull ? `
            <div style="text-align: center; padding: 24px; background: var(--card); border-radius: 16px; border: 1px solid var(--danger);">
              <i class="fas fa-ban" style="font-size: 48px; color: var(--danger); margin-bottom: 12px;"></i>
              <h3 style="color: var(--danger);">Torneo Completo</h3>
              <p style="color: var(--text-secondary);">Ya no hay lugares disponibles en este torneo.</p>
              <a href="#/torneos" class="btn btn-primary" style="margin-top: 16px;">Ver otros torneos</a>
            </div>
          ` : !isLoggedIn ? `
            <div style="text-align: center; padding: 24px; background: var(--card); border-radius: 16px; border: 1px solid var(--border);">
              <i class="fas fa-user-lock" style="font-size: 48px; color: var(--primary); margin-bottom: 12px;"></i>
              <h3 style="color: var(--text);">Inicia sesión para registrarte</h3>
              <p style="color: var(--text-secondary); margin-bottom: 16px;">
                Necesitas una cuenta para inscribirte al torneo.
              </p>
              <div style="display: flex; gap: 12px; justify-content: center;">
                <a href="#/login" class="btn btn-primary">
                  <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                </a>
                <a href="#/registro" class="btn btn-secondary">
                  <i class="fas fa-user-plus"></i> Registrarse
                </a>
              </div>
            </div>
          ` : `
            <div style="background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px;">
              <h3 style="color: var(--text); margin-bottom: 16px; text-align: center;">
                <i class="fas fa-user-plus"></i> Registrar Equipo
              </h3>
              <form id="inviteRegisterForm">
                <div style="margin-bottom: 16px;">
                  <label style="display: block; color: var(--text); font-weight: 600; margin-bottom: 6px;">
                    <i class="fas fa-shield-alt"></i> Nombre del Equipo *
                  </label>
                  <input type="text" id="inviteTeamName" placeholder="Mi Equipo Pro" required minlength="3" maxlength="30"
                    style="width: 100%; padding: 12px; background: var(--background); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px;">
                  <small style="color: var(--text-secondary);">3-30 caracteres</small>
                </div>
                <div style="margin-bottom: 16px;">
                  <label style="display: block; color: var(--text); font-weight: 600; margin-bottom: 6px;">
                    <i class="fas fa-tag"></i> Tag del Equipo *
                  </label>
                  <input type="text" id="inviteTeamTag" placeholder="MEP" required minlength="2" maxlength="5"
                    style="width: 100%; padding: 12px; background: var(--background); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px;">
                  <small style="color: var(--text-secondary);">2-5 caracteres (ej: NaVi, FaZe)</small>
                </div>
                <div style="margin-bottom: 24px;">
                  <label style="display: block; color: var(--text); font-weight: 600; margin-bottom: 6px;">
                    <i class="fas fa-image"></i> URL del Logo (opcional)
                  </label>
                  <input type="url" id="inviteTeamLogo" placeholder="https://ejemplo.com/logo.png"
                    style="width: 100%; padding: 12px; background: var(--background); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px;">
                </div>

                <div style="background: rgba(0,212,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid rgba(0,212,255,0.2);">
                  <p style="color: var(--text-secondary); font-size: 13px; margin: 0;">
                    <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                    Serás el capitán del equipo. ${requiresPayment ? 'Después del registro deberás pagar la cuota de inscripción para confirmar tu lugar.' : ''}
                  </p>
                </div>

                <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; padding: 14px; font-size: 16px;" id="inviteSubmitBtn">
                  <i class="fas fa-check-circle"></i>
                  ${requiresPayment ? 'Registrarse y Proceder al Pago' : 'Registrarse al Torneo'}
                </button>
              </form>
              <div id="inviteResult" style="display: none;"></div>
            </div>
          `}
        </div>
      </div>
    `;

    // Bind form submission
    const form = document.getElementById('inviteRegisterForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('inviteSubmitBtn');
        const resultDiv = document.getElementById('inviteResult');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';

        try {
          const response = await API.tournaments.registerViaInvite(inviteCode, {
            team_name: document.getElementById('inviteTeamName').value,
            team_tag: document.getElementById('inviteTeamTag').value,
            logo_url: document.getElementById('inviteTeamLogo').value || undefined
          });

          form.style.display = 'none';
          resultDiv.style.display = 'block';

          if (response.data?.requires_payment) {
            resultDiv.innerHTML = `
              <div style="text-align: center; padding: 20px;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: var(--success); margin-bottom: 12px;"></i>
                <h3 style="color: var(--text);">¡Equipo Registrado!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 16px;">${response.data.message}</p>
                <div style="background: rgba(255,193,7,0.1); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,193,7,0.3); margin-bottom: 16px;">
                  <strong style="color: var(--warning);">Cuota pendiente: ${formatCurrency(response.data.entry_fee)}</strong>
                  <p style="color: var(--text-secondary); font-size: 12px; margin-top: 4px;">
                    Tu lugar no se confirma hasta completar el pago.
                  </p>
                </div>
                <a href="#/pagos" class="btn btn-primary">
                  <i class="fas fa-credit-card"></i> Ir a Pagar
                </a>
              </div>
            `;
          } else {
            resultDiv.innerHTML = `
              <div style="text-align: center; padding: 20px;">
                <i class="fas fa-trophy" style="font-size: 48px; color: var(--success); margin-bottom: 12px;"></i>
                <h3 style="color: var(--success);">¡Inscripción Exitosa!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 16px;">${response.data.message}</p>
                <a href="#/torneo/${tournament.id}" class="btn btn-primary">
                  <i class="fas fa-eye"></i> Ver Torneo
                </a>
              </div>
            `;
          }
        } catch (error) {
          btn.disabled = false;
          btn.innerHTML = `<i class="fas fa-check-circle"></i> ${requiresPayment ? 'Registrarse y Proceder al Pago' : 'Registrarse al Torneo'}`;
          
          resultDiv.style.display = 'block';
          resultDiv.innerHTML = `
            <div style="background: rgba(255,0,0,0.1); border: 1px solid rgba(255,0,0,0.3); border-radius: 8px; padding: 12px; margin-top: 12px; text-align: center;">
              <i class="fas fa-exclamation-circle" style="color: var(--danger);"></i>
              <strong style="color: var(--danger);">${error.message || 'Error al registrarse'}</strong>
            </div>
          `;
        }
      });
    }

  } catch (error) {
    console.error('Error loading invite:', error);
    container.innerHTML = `
      <div class="container" style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
        <i class="fas fa-link-slash" style="font-size: 64px; color: var(--danger); margin-bottom: 16px;"></i>
        <h2 style="color: var(--text);">Invitación no válida</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">${error.message || 'El código de invitación no es válido o ha expirado.'}</p>
        <a href="#/torneos" class="btn btn-primary">Ver torneos disponibles</a>
      </div>
    `;
  }
}

function formatTournamentFormat(format) {
  const formats = {
    'SINGLE_ELIMINATION': 'Eliminación Simple',
    'DOUBLE_ELIMINATION': 'Doble Eliminación',
    'ROUND_ROBIN': 'Round Robin',
    'SWISS': 'Suizo'
  };
  return formats[format] || format;
}
