// =====================================================
// PAGE - Create Clan (Crear nuevo clan)
// =====================================================

import API from '../api.js';
import { getStoredUser, isAuthenticated } from '../auth.js';
import { showToast } from '../ui-helpers.js';

export async function renderCreateClanPage(container) {
    if (!isAuthenticated()) {
        container.innerHTML = `
            <div class="section">
                <div class="container">
                    <div class="auth-required">
                        <i class="fas fa-lock"></i>
                        <h2>Inicia sesión</h2>
                        <p>Debes iniciar sesión para crear un clan</p>
                        <a href="#/login" class="btn btn-primary">Iniciar Sesión</a>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Check if user already has a clan
    const user = getStoredUser();
    try {
        const response = await API.users.getClan(user.id);
        if (response.data) {
            showToast('info', 'Ya perteneces a un clan');
            window.location.hash = `#/clan/${response.data.id}`;
            return;
        }
    } catch (error) {
        // No clan, continue
    }

    container.innerHTML = `
        <div class="section">
            <div class="container">
                <div class="create-clan-page">
                    <a href="#/clanes" class="btn btn-secondary back-link">
                        <i class="fas fa-arrow-left"></i> Volver a Clanes
                    </a>

                    <div class="create-clan-header">
                        <h1><i class="fas fa-shield-alt"></i> Crear Nuevo Clan</h1>
                        <p>Crea tu propio clan y lidera a tu equipo hacia la victoria</p>
                    </div>

                    <form id="createClanForm" class="create-clan-form">
                        <div class="form-section">
                            <h3><i class="fas fa-info-circle"></i> Información Básica</h3>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Nombre del Clan *</label>
                                    <input type="text" class="form-control" name="name" required
                                           minlength="3" maxlength="50"
                                           placeholder="Ej: Los Guerreros Supremos">
                                    <span class="form-hint">Entre 3 y 50 caracteres</span>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Tag (Abreviación) *</label>
                                    <input type="text" class="form-control" name="tag" required
                                           minlength="2" maxlength="5"
                                           placeholder="Ej: GS" style="text-transform: uppercase;">
                                    <span class="form-hint">2-5 caracteres, se mostrará como [TAG]</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Descripción</label>
                                <textarea class="form-control" name="description" rows="4"
                                          placeholder="Describe tu clan, su historia, objetivos..."></textarea>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-image"></i> Apariencia</h3>
                            
                            <div class="form-group">
                                <label class="form-label">URL del Banner</label>
                                <input type="url" class="form-control" name="banner_url"
                                       placeholder="https://ejemplo.com/banner.jpg">
                                <span class="form-hint">Imagen de fondo del clan (recomendado: 1200x400px)</span>
                            </div>

                            <div class="banner-preview" id="bannerPreview">
                                <i class="fas fa-image"></i>
                                <span>Vista previa del banner</span>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-cog"></i> Configuración</h3>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Tipo de Acceso *</label>
                                    <select class="form-control" name="access_type" required>
                                        <option value="OPEN">🔓 Abierto - Cualquiera puede unirse</option>
                                        <option value="INVITE_ONLY">✉️ Por Invitación - Requiere solicitud</option>
                                        <option value="CLOSED">🔒 Cerrado - No acepta nuevos miembros</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Máximo de Miembros</label>
                                    <input type="number" class="form-control" name="max_members"
                                           min="5" max="100" value="50">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Región / Ubicación</label>
                                <input type="text" class="form-control" name="location"
                                       placeholder="Ej: México, Latinoamérica, Global...">
                            </div>

                            <div class="form-group requirements-group" id="requirementsGroup">
                                <label class="form-label">Requisitos para Unirse</label>
                                <textarea class="form-control" name="requirements" rows="3"
                                          placeholder="Ej: Nivel mínimo, disponibilidad horaria, edad..."></textarea>
                                <span class="form-hint">Se mostrará a los usuarios que quieran unirse</span>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="window.location.hash='#/clanes'">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary btn-lg">
                                <i class="fas fa-check"></i> Crear Clan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    setupEventListeners();
}

function setupEventListeners() {
    const form = document.getElementById('createClanForm');
    const bannerInput = form.querySelector('[name="banner_url"]');
    const bannerPreview = document.getElementById('bannerPreview');

    // Banner preview
    bannerInput?.addEventListener('input', (e) => {
        const url = e.target.value;
        if (url) {
            bannerPreview.style.backgroundImage = `url('${url}')`;
            bannerPreview.classList.add('has-image');
        } else {
            bannerPreview.style.backgroundImage = '';
            bannerPreview.classList.remove('has-image');
        }
    });

    // Form submit
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';

        const formData = new FormData(form);
        const user = getStoredUser();

        const data = {
            name: formData.get('name'),
            tag: formData.get('tag').toUpperCase(),
            description: formData.get('description') || null,
            banner_url: formData.get('banner_url') || null,
            location: formData.get('location') || null,
            access_type: formData.get('access_type'),
            requirements: formData.get('requirements') || null,
            max_members: parseInt(formData.get('max_members')) || 50,
            leader_id: user.id
        };

        try {
            const response = await API.clans.create(data);
            showToast('success', '¡Clan creado exitosamente!');
            window.location.hash = `#/clan/${response.data.id}`;
        } catch (error) {
            showToast('error', error.message || 'Error al crear el clan');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Crear Clan';
        }
    });
}

export default { renderCreateClanPage };
