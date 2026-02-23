// =====================================================
// PAGE - Crear Clan — Solo Líder + Miembros
// =====================================================

import API from '../api.js';
import { getStoredUser, isAuthenticated } from '../auth.js';
import { showToast } from '../ui-helpers.js';

export function renderCreateClanPage(container) {
    if (!isAuthenticated()) {
        container.innerHTML = '<div class="section"><div class="container">' +
            '<div class="error-state">' +
            '<i class="fas fa-lock"></i>' +
            '<h3>Acceso Restringido</h3>' +
            '<p>Debes iniciar sesion para crear un clan.</p>' +
            '<a href="#/login" class="btn btn-primary" style="margin-top:16px"><i class="fas fa-sign-in-alt"></i> Iniciar Sesion</a>' +
            '</div></div></div>';
        return;
    }

    container.innerHTML = '<div class="section"><div class="container">' +
        '<div class="create-clan-page">' +
        '<a href="#/clanes" class="btn btn-secondary back-link"><i class="fas fa-arrow-left"></i> Volver a Clanes</a>' +
        '<div class="create-clan-header">' +
        '<h1><i class="fas fa-plus-circle"></i> Crear Clan</h1>' +
        '<p>Crea tu clan y conviertete en el lider. Tu invitas jugadores y ellos deciden si aceptan.</p>' +
        '</div>' +
        '<form id="createClanForm" class="create-clan-form">' +
        '<div class="form-section">' +
        '<h3><i class="fas fa-info-circle"></i> Informacion Basica</h3>' +
        '<div class="form-row">' +
        '<div class="form-group"><label class="form-label">Nombre del Clan *</label>' +
        '<input type="text" class="form-control" name="name" id="clanName" required minlength="3" maxlength="30" placeholder="Ej: Shadow Reapers">' +
        '<span class="form-hint">3-30 caracteres, debe ser unico</span></div>' +
        '<div class="form-group"><label class="form-label">Tag del Clan *</label>' +
        '<input type="text" class="form-control" name="tag" id="clanTag" required minlength="2" maxlength="5" placeholder="Ej: SHR" style="text-transform:uppercase">' +
        '<span class="form-hint">2-5 caracteres (se mostrara junto al nombre)</span></div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Descripcion</label>' +
        '<textarea class="form-control" name="description" id="clanDesc" rows="3" maxlength="500" placeholder="Describe tu clan, objetivos y que tipo de jugadores buscas..."></textarea>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-top:6px">' +
        '<span class="form-hint" style="margin:0">Maximo 500 caracteres</span>' +
        '<button type="button" class="btn-ai-generate" id="aiGenClanDesc" title="Generar descripción con IA">' +
        '<i class="fas fa-robot"></i> ✨ Generar con IA</button>' +
        '</div></div>' +
        '<div class="form-group"><label class="form-label">Region / Ubicacion</label>' +
        '<input type="text" class="form-control" name="location" id="clanLocation" placeholder="Ej: Latinoamerica, Mexico, etc.">' +
        '</div>' +
        '</div>' +
        '<div class="form-section">' +
        '<h3><i class="fas fa-palette"></i> Apariencia</h3>' +
        '<div class="form-group"><label class="form-label">URL del Banner</label>' +
        '<input type="url" class="form-control" name="banner_url" id="clanBanner" placeholder="https://ejemplo.com/imagen.jpg">' +
        '<span class="form-hint">Imagen que se mostrara como fondo del clan</span></div>' +
        '<div class="form-group"><label class="form-label">Vista Previa del Banner</label>' +
        '<div class="banner-preview" id="bannerPreview"><i class="fas fa-image"></i><span>Sin imagen</span></div>' +
        '</div>' +
        '</div>' +
        '<div class="form-section">' +
        '<h3><i class="fas fa-cog"></i> Configuracion</h3>' +
        '<div class="form-row">' +
        '<div class="form-group"><label class="form-label">Tipo de Acceso</label>' +
        '<select class="form-control" name="access_type" id="clanAccess">' +
        '<option value="OPEN">Abierto - Cualquiera puede unirse</option>' +
        '<option value="INVITE_ONLY" selected>Por Invitacion - Solo por invitacion del lider</option>' +
        '<option value="CLOSED">Cerrado - No se aceptan nuevos miembros</option>' +
        '</select></div>' +
        '<div class="form-group"><label class="form-label">Maximo de Miembros</label>' +
        '<input type="number" class="form-control" name="max_members" id="clanMaxMembers" min="2" max="100" value="50">' +
        '</div>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Requisitos de Ingreso</label>' +
        '<textarea class="form-control" name="requirements" id="clanReqs" rows="3" maxlength="300" placeholder="Ej: Nivel minimo 50, microfono obligatorio, etc."></textarea>' +
        '</div>' +
        '</div>' +
        '<div class="form-section" style="background:rgba(0,212,255,0.03);border-color:rgba(0,212,255,0.1)">' +
        '<h3><i class="fas fa-eye"></i> Vista Previa</h3>' +
        '<div id="livePreview" style="max-width:400px">' +
        '<div class="clan-card" style="pointer-events:none">' +
        '<div class="clan-banner" id="previewBanner"><i class="fas fa-shield-alt"></i>' +
        '<div class="clan-access-badge invite_only" id="previewBadge"><i class="fas fa-envelope"></i> Por Invitacion</div>' +
        '</div>' +
        '<div class="clan-content">' +
        '<div class="clan-header">' +
        '<span class="clan-name" id="previewName">Nombre del Clan</span>' +
        '<span class="clan-tag" id="previewTag">[TAG]</span>' +
        '</div>' +
        '<p class="clan-description" id="previewDesc">La descripcion de tu clan aparecera aqui...</p>' +
        '<div class="clan-leader"><i class="fas fa-crown"></i> Lider: <strong id="previewLeader">Tu</strong></div>' +
        '<div class="clan-meta"><span><i class="fas fa-users"></i> 1/<span id="previewMax">50</span></span><span id="previewLocation"></span></div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="form-actions">' +
        '<a href="#/clanes" class="btn btn-secondary"><i class="fas fa-times"></i> Cancelar</a>' +
        '<button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Crear Clan</button>' +
        '</div>' +
        '</form>' +
        '</div>' +
        '</div></div>';

    setupPreview();
    setupFormSubmit();
}

function setupPreview() {
    var nameInput = document.getElementById('clanName');
    var tagInput = document.getElementById('clanTag');
    var descInput = document.getElementById('clanDesc');
    var locationInput = document.getElementById('clanLocation');
    var bannerInput = document.getElementById('clanBanner');
    var accessInput = document.getElementById('clanAccess');
    var maxInput = document.getElementById('clanMaxMembers');

    var previewName = document.getElementById('previewName');
    var previewTag = document.getElementById('previewTag');
    var previewDesc = document.getElementById('previewDesc');
    var previewLeader = document.getElementById('previewLeader');
    var previewLocation = document.getElementById('previewLocation');
    var previewBanner = document.getElementById('previewBanner');
    var previewBadge = document.getElementById('previewBadge');
    var previewMax = document.getElementById('previewMax');
    var bannerPreviewDiv = document.getElementById('bannerPreview');

    var user = getStoredUser();
    if (previewLeader && user) previewLeader.textContent = user.username || 'Tu';

    function updatePreview() {
        if (previewName) previewName.textContent = (nameInput && nameInput.value) ? nameInput.value : 'Nombre del Clan';
        if (previewTag) previewTag.textContent = '[' + ((tagInput && tagInput.value) ? tagInput.value.toUpperCase() : 'TAG') + ']';
        if (previewDesc) previewDesc.textContent = (descInput && descInput.value) ? descInput.value : 'La descripcion aparecera aqui...';
        if (previewMax && maxInput) previewMax.textContent = maxInput.value || '50';

        if (previewLocation && locationInput) {
            if (locationInput.value) {
                previewLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + locationInput.value;
            } else {
                previewLocation.innerHTML = '';
            }
        }

        if (bannerInput && previewBanner) {
            if (bannerInput.value) {
                previewBanner.style.backgroundImage = "url('" + bannerInput.value + "')";
                previewBanner.style.backgroundSize = 'cover';
                previewBanner.style.backgroundPosition = 'center';
                var icon = previewBanner.querySelector(':scope > i');
                if (icon) icon.style.display = 'none';
            } else {
                previewBanner.style.backgroundImage = '';
                var icon2 = previewBanner.querySelector(':scope > i');
                if (icon2) icon2.style.display = '';
            }
        }

        if (bannerInput && bannerPreviewDiv) {
            if (bannerInput.value) {
                bannerPreviewDiv.style.backgroundImage = "url('" + bannerInput.value + "')";
                bannerPreviewDiv.classList.add('has-image');
            } else {
                bannerPreviewDiv.style.backgroundImage = '';
                bannerPreviewDiv.classList.remove('has-image');
            }
        }

        if (accessInput && previewBadge) {
            var val = accessInput.value;
            var icon = 'fa-shield-alt';
            var label = 'Desconocido';
            var cls = 'open';
            if (val === 'OPEN') { icon = 'fa-unlock'; label = 'Abierto'; cls = 'open'; }
            else if (val === 'INVITE_ONLY') { icon = 'fa-envelope'; label = 'Por Invitacion'; cls = 'invite_only'; }
            else if (val === 'CLOSED') { icon = 'fa-lock'; label = 'Cerrado'; cls = 'closed'; }
            previewBadge.className = 'clan-access-badge ' + cls;
            previewBadge.innerHTML = '<i class="fas ' + icon + '"></i> ' + label;
        }
    }

    if (nameInput) nameInput.addEventListener('input', updatePreview);
    if (tagInput) tagInput.addEventListener('input', updatePreview);
    if (descInput) descInput.addEventListener('input', updatePreview);
    if (locationInput) locationInput.addEventListener('input', updatePreview);
    if (bannerInput) bannerInput.addEventListener('input', updatePreview);
    if (accessInput) accessInput.addEventListener('change', updatePreview);
    if (maxInput) maxInput.addEventListener('input', updatePreview);

    // AI Description Generator
    var aiBtn = document.getElementById('aiGenClanDesc');
    if (aiBtn) {
        aiBtn.addEventListener('click', async function () {
            var name = nameInput?.value || '';
            if (!name) {
                showToast('warning', 'Escribe el nombre del clan primero');
                return;
            }
            aiBtn.disabled = true;
            aiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
            try {
                var resp = await fetch((API.baseUrl || 'http://localhost:3000') + '/ai/generate-description', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'clan',
                        name: name,
                        tag: tagInput?.value || '',
                        location: locationInput?.value || '',
                        accessType: accessInput?.value || ''
                    })
                });
                var data = await resp.json();
                if (data.success && data.data?.description && descInput) {
                    descInput.value = data.data.description.substring(0, 500);
                    updatePreview();
                    showToast('success', 'Descripción generada con IA ✨');
                }
            } catch (err) {
                showToast('error', 'No se pudo generar la descripción');
            }
            aiBtn.disabled = false;
            aiBtn.innerHTML = '<i class="fas fa-robot"></i> ✨ Generar con IA';
        });
    }
}

function setupFormSubmit() {
    var form = document.getElementById('createClanForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var formData = new FormData(form);
        var data = {
            name: formData.get('name'),
            tag: formData.get('tag'),
            description: formData.get('description'),
            location: formData.get('location'),
            banner_url: formData.get('banner_url'),
            access_type: formData.get('access_type'),
            max_members: parseInt(formData.get('max_members')) || 50,
            requirements: formData.get('requirements')
        };

        if (!data.name || data.name.length < 3) {
            showToast('error', 'El nombre debe tener al menos 3 caracteres');
            return;
        }
        if (!data.tag || data.tag.length < 2) {
            showToast('error', 'El tag debe tener al menos 2 caracteres');
            return;
        }

        var submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        }

        try {
            var user = getStoredUser();
            data.leader_id = user.id;

            await API.clans.create(data);
            showToast('success', 'Clan creado exitosamente! Ahora puedes invitar jugadores.');
            window.location.hash = '#/clanes';
        } catch (error) {
            showToast('error', error.message || 'Error al crear el clan');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Crear Clan';
            }
        }
    });
}

export default { renderCreateClanPage: renderCreateClanPage };
