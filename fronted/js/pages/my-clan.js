import API from '../api.js';
import Auth from '../auth.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate } from '../ui.js';
import { getInitials } from '../utils.js';

let currentClan = null;

export async function renderMyClan(container) {
    showLoading(container);

    try {
        const user = Auth.getUser();
        console.log('📡 Fetching Clan Data for user:', user.id);

        // Fetch all teams and find the one where user is captain
        const teamsResponse = await API.teams.getAll();
        const allTeams = teamsResponse.data || [];
        
        // Find clan where user is captain/owner
        currentClan = allTeams.find(t => t.captain_id === user.id) || null;

        if (!currentClan) {
            // Líder sin clan - Mostrar mensaje de error/soporte
            container.innerHTML = `
            <div class="data-card" style="max-width: 600px; margin: 50px auto; text-align: center;">
                <div class="card-header" style="justify-content: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h2 class="card-title" style="margin: 0;">
                        <i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>
                        Clan No Encontrado
                    </h2>
                </div>
                <div class="card-body" style="padding: 40px;">
                    <div class="empty-icon" style="font-size: 64px; color: var(--warning); margin-bottom: 20px;">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3 style="margin-bottom: 10px;">No tienes un clan asignado</h3>
                    <p class="text-muted" style="margin-bottom: 20px;">
                        Para ser líder de clan, necesitas tener un clan verificado asignado a tu cuenta.
                    </p>
                    
                    <div class="support-notice" style="background: rgba(255, 184, 0, 0.1); border: 1px solid rgba(255, 184, 0, 0.3); border-radius: 12px; padding: 20px; margin-top: 20px;">
                        <i class="fas fa-headset" style="font-size: 32px; color: var(--warning); margin-bottom: 10px;"></i>
                        <h4 style="color: var(--warning); margin-bottom: 10px;">¿Necesitas un clan?</h4>
                        <p class="text-muted" style="font-size: 14px; margin-bottom: 15px;">
                            Contacta con el equipo de soporte para solicitar la creación y verificación de tu clan.
                        </p>
                        <a href="mailto:soporte@apextournament.com" class="btn btn-warning" style="gap: 8px;">
                            <i class="fas fa-envelope"></i> Contactar Soporte
                        </a>
                    </div>
                </div>
            </div>
        `;
            return;
        }

        // Prepare Members List (Handle data structure)
        const members = currentClan.members || currentClan.players || [];

        container.innerHTML = `
      <div class="clan-header-card gradient-border-card mb-4" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 212, 255, 0.1) 100%); padding: 30px; border-radius: 20px; text-align: center;">
            <div class="clan-logo-wrapper" style="position: relative; display: inline-block;">
                <img src="${currentClan.logo_url || 'https://via.placeholder.com/150'}" alt="${currentClan.name}" style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid var(--primary); object-fit: cover;">
                <div class="clan-tag-badge" style="position: absolute; bottom: 0; right: 0; background: var(--primary); color: white; padding: 4px 10px; border-radius: 20px; font-weight: bold; font-family: 'Orbitron', sans-serif;">[${currentClan.tag}]</div>
            </div>
            <h1 style="margin-top: 16px; font-family: 'Orbitron', sans-serif;">${currentClan.name}</h1>
            <p class="text-muted" style="max-width: 600px; margin: 10px auto;">${currentClan.description || 'Sin descripción'}</p>
            
            <div class="clan-stats-row" style="display: flex; justify-content: center; gap: 30px; margin-top: 20px;">
                <div class="clan-stat">
                    <span style="display: block; font-size: 24px; font-weight: bold; color: var(--primary);">${members.length}</span>
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Miembros</span>
                </div>
                <div class="clan-stat">
                    <span style="display: block; font-size: 24px; font-weight: bold; color: var(--success);">${currentClan.tournaments_count || 0}</span>
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Torneos</span>
                </div>
                <div class="clan-stat">
                    <span style="display: block; font-size: 24px; font-weight: bold; color: var(--warning);">${formatDate(currentClan.created_at)}</span>
                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Fundado</span>
                </div>
            </div>
      </div>

      <!-- Aviso de Soporte para Líder -->
      <div class="leader-notice" style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
          <i class="fas fa-crown" style="font-size: 24px; color: var(--warning);"></i>
          <div style="flex: 1;">
              <strong style="color: var(--warning);">Eres el líder de este clan</strong>
              <p class="text-muted" style="margin: 4px 0 0 0; font-size: 13px;">
                  Como líder verificado, para transferir el liderazgo o abandonar el clan debes contactar con soporte.
              </p>
          </div>
          <a href="mailto:soporte@apextournament.com" class="btn btn-secondary btn-sm" style="white-space: nowrap;">
              <i class="fas fa-headset"></i> Contactar Soporte
          </a>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-users"></i>
            Miembros del Clan
          </h2>
          <div class="card-actions">
            <button class="btn btn-primary" id="btnInviteMember">
              <i class="fas fa-user-plus"></i> Invitar
            </button>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Miembro</th>
                <th>Rol</th>
                <th>Fecha Unión</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="clanMembersTableBody">
              ${renderMembersRows(members)}
            </tbody>
          </table>
        </div>
      </div>
    `;

        // Event Listeners
        document.getElementById('btnInviteMember').addEventListener('click', () => showInviteModal());
        document.getElementById('clanMembersTableBody').addEventListener('click', handleMemberActions);

    } catch (error) {
        console.error('Error loading clan details:', error);
        container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar datos del clan</h3>
        <p>${error.message}</p>
      </div>
    `;
    }
}

function renderMembersRows(members) {
    if (!members || members.length === 0) {
        return `<tr><td colspan="5" class="text-center text-muted">Aún no hay miembros en este clan</td></tr>`;
    }

    // If members are objects with { user: {...}, role: ... } structure (Prisma relation)
    // Or flat objects depending on API response. I'll code strictly for { user: {}, role: ... } which is common.
    // But wait, the API response for 'getClan' logic is unknown. I'll code defensively.

    return members.map(member => {
        const user = member.user || member; // Fallback if flat
        const role = member.role || 'MEMBER';
        const joinedAt = member.joined_at || new Date();

        return `
    <tr data-id="${user.id}">
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
            <div class="avatar-small" style="width: 32px; height: 32px; background: var(--bg-tertiary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                ${getInitials(user.username)}
            </div>
            <strong>${user.username}</strong>
        </div>
      </td>
      <td>${getClanRoleBadge(role)}</td>
      <td>${formatDate(joinedAt)}</td>
      <td><span class="badge badge-success">Activo</span></td>
      <td>
        ${role !== 'LEADER' ? `
        <button class="btn btn-danger btn-sm btn-icon" data-action="kick" title="Expulsar">
          <i class="fas fa-user-times"></i>
        </button>
        ` : '<span class="text-muted" style="font-size: 12px;">Líder</span>'}
      </td>
    </tr>
    `;
    }).join('');
}

function getClanRoleBadge(role) {
    const colors = {
        'LEADER': 'var(--warning)',
        'OFFICER': 'var(--primary)',
        'MEMBER': 'var(--text-secondary)'
    };
    const labels = {
        'LEADER': 'Líder',
        'OFFICER': 'Oficial',
        'MEMBER': 'Miembro'
    };
    return `<span style="color: ${colors[role] || 'white'}; font-weight: bold; font-size: 12px;">${labels[role] || role}</span>`;
}

function showInviteModal() {
    openModal('Invitar Miembros', `
        <div class="text-center">
            <p>Comparte este enlace para invitar jugadores a <strong>${currentClan?.name}</strong></p>
            <div class="input-group" style="display: flex; gap: 10px; margin: 20px 0;">
                <input type="text" class="form-control" value="${window.location.origin}/join/${currentClan?.id}" readonly id="inviteLink">
                <button class="btn btn-secondary" onclick="copyInviteLink()"><i class="fas fa-copy"></i></button>
            </div>
            <p class="text-muted" style="font-size: 12px;">Los usuarios podrán solicitar unirse usando este enlace.</p>
        </div>
    `);
}

window.copyInviteLink = function () {
    const copyText = document.getElementById("inviteLink");
    copyText.select();
    document.execCommand("copy"); // Fallback
    navigator.clipboard.writeText(copyText.value).then(() => {
        showToast('success', 'Enlace copiado', 'El enlace de invitación ha sido copiado al portapapeles');
    });
};

async function handleMemberActions(e) {
    // Implement Kick logic here if API supports it
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    if (btn.dataset.action === 'kick') {
        const row = btn.closest('tr');
        const userId = row.dataset.id;

        if (await confirmDialog('¿Estás seguro de expulsar a este miembro?')) {
            showToast('info', 'Proximamente', 'La función de expulsar estará disponible pronto (API Pending)');
            // await API.clans.removeMember(currentClan.id, userId);
        }
    }
}
