// =====================================================
// PAGES - Games Management
// =====================================================

import API from '../api.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate } from '../ui.js';

let allGames = [];

export async function renderGames(container) {
  showLoading(container);

  try {
    const response = await API.games.getAll();
    allGames = response.data || [];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-dice-d20"></i>
            Gestión de Juegos (${allGames.length})
          </h2>
          <div class="card-actions">
            <input type="text" class="form-control" id="searchGames" 
                   placeholder="Buscar juegos..." style="width: 250px;">
            <button class="btn btn-primary" id="btnNewGame">
              <i class="fas fa-plus"></i> Nuevo Juego
            </button>
          </div>
        </div>
        <div id="gamesGrid" class="games-grid">
          ${renderGamesCards(allGames)}
        </div>
      </div>
      <style>
        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          padding: 20px;
        }
        .game-card {
          background: var(--bg-tertiary);
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .game-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .game-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
        }
        .game-image-placeholder {
          width: 100%;
          height: 150px;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          color: white;
        }
        .game-content {
          padding: 20px;
        }
        .game-name {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .game-developer {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 10px;
        }
        .game-meta {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }
        .game-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
        .game-meta-item i {
          color: var(--primary-color);
        }
        .game-genre {
          display: inline-block;
          padding: 4px 10px;
          background: var(--primary-color);
          color: white;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .game-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid var(--border-color);
        }
        .game-actions .btn {
          flex: 1;
        }
      </style>
    `;

    // Event Listeners
    document.getElementById('btnNewGame').addEventListener('click', () => showGameForm());
    document.getElementById('searchGames').addEventListener('input', handleSearch);
    document.getElementById('gamesGrid').addEventListener('click', handleCardActions);

  } catch (error) {
    console.error('Error loading games:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar juegos</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function renderGamesCards(games) {
  if (games.length === 0) {
    return `
      <div class="empty-state" style="grid-column: 1/-1;">
        <i class="fas fa-dice-d20"></i>
        <h3>No hay juegos</h3>
        <p>Crea tu primer juego para comenzar</p>
      </div>
    `;
  }

  const gameIcons = {
    'lol': 'fa-chess-queen',
    'valorant': 'fa-crosshairs',
    'cs2': 'fa-gun',
    'fc25': 'fa-futbol',
    'rocket-league': 'fa-car',
    'clash-royale': 'fa-crown',
    'default': 'fa-gamepad'
  };

  return games.map(g => {
    const icon = gameIcons[g.slug] || gameIcons['default'];
    return `
    <div class="game-card" data-id="${g.id}" data-game="${g.slug || ''}">
      ${g.cover_image_url ? 
        `<img src="${g.cover_image_url}" alt="${g.name}" class="game-image" onerror="this.outerHTML='<div class=game-image-placeholder><i class=fas ${icon}></i></div>'">` :
        `<div class="game-image-placeholder"><i class="fas ${icon}"></i></div>`
      }
      <div class="game-content">
        <h3 class="game-name">${g.name}</h3>
        <p class="game-developer"><i class="fas fa-building"></i> ${g.developer || 'Desarrollador desconocido'}</p>
        <div class="game-meta">
          <span class="game-meta-item">
            <i class="fas fa-users"></i> ${g.team_size_default || 1}v${g.team_size_default || 1}
          </span>
        </div>
        <span class="game-genre"><i class="fas fa-tag"></i> ${g.slug || 'Videojuego'}</span>
        <div class="game-actions">
          <button class="btn btn-secondary btn-sm" data-action="edit">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </div>
      </div>
    </div>
  `}).join('');
}

function formatGenre(genre) {
  const genres = {
    'FPS': 'Shooter (FPS)',
    'MOBA': 'MOBA',
    'BATTLE_ROYALE': 'Battle Royale',
    'SPORTS': 'Deportes',
    'RACING': 'Carreras',
    'FIGHTING': 'Lucha',
    'STRATEGY': 'Estrategia',
    'OTHER': 'Otro'
  };
  return genres[genre] || genre;
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const filtered = allGames.filter(g => 
    g.name.toLowerCase().includes(query) ||
    (g.developer && g.developer.toLowerCase().includes(query))
  );
  document.getElementById('gamesGrid').innerHTML = renderGamesCards(filtered);
}

async function handleCardActions(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const card = btn.closest('.game-card');
  const gameId = card.dataset.id;

  if (action === 'edit') {
    const game = allGames.find(g => g.id === gameId);
    showGameForm(game);
  } else if (action === 'delete') {
    if (await confirmDialog('¿Estás seguro de eliminar este juego? Se eliminarán todos los torneos asociados.')) {
      try {
        await API.games.delete(gameId);
        showToast('success', 'Éxito', 'Juego eliminado correctamente');
        card.remove();
        allGames = allGames.filter(g => g.id !== gameId);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    }
  }
}

function showGameForm(game = null) {
  const isEdit = !!game;
  const title = isEdit ? 'Editar Juego' : 'Nuevo Juego';

  const formHtml = `
    <form id="gameForm">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nombre del Juego *</label>
          <input type="text" class="form-control" name="name" 
                 value="${game?.name || ''}" required placeholder="Ej: League of Legends">
        </div>
        <div class="form-group">
          <label class="form-label">Slug *</label>
          <input type="text" class="form-control" name="slug" 
                 value="${game?.slug || ''}" required placeholder="league-of-legends">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Desarrollador</label>
          <input type="text" class="form-control" name="developer" 
                 value="${game?.developer || ''}" placeholder="Ej: Riot Games">
        </div>
        <div class="form-group">
          <label class="form-label">Año de Lanzamiento</label>
          <input type="number" class="form-control" name="release_year" 
                 value="${game?.release_year || ''}" min="1990" max="2030" placeholder="2023">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Género *</label>
          <select class="form-control" name="genre" required>
            <option value="">Seleccionar género</option>
            <option value="FPS" ${game?.genre === 'FPS' ? 'selected' : ''}>Shooter (FPS)</option>
            <option value="MOBA" ${game?.genre === 'MOBA' ? 'selected' : ''}>MOBA</option>
            <option value="BATTLE_ROYALE" ${game?.genre === 'BATTLE_ROYALE' ? 'selected' : ''}>Battle Royale</option>
            <option value="SPORTS" ${game?.genre === 'SPORTS' ? 'selected' : ''}>Deportes</option>
            <option value="RACING" ${game?.genre === 'RACING' ? 'selected' : ''}>Carreras</option>
            <option value="FIGHTING" ${game?.genre === 'FIGHTING' ? 'selected' : ''}>Lucha</option>
            <option value="STRATEGY" ${game?.genre === 'STRATEGY' ? 'selected' : ''}>Estrategia</option>
            <option value="OTHER" ${game?.genre === 'OTHER' ? 'selected' : ''}>Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tamaño de Equipo</label>
          <input type="number" class="form-control" name="team_size" 
                 value="${game?.team_size || 5}" min="1" max="20">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">URL de Imagen de Portada</label>
        <input type="url" class="form-control" name="cover_image_url" 
               value="${game?.cover_image_url || ''}" placeholder="https://...">
      </div>

      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea class="form-control" name="description" rows="3" 
                  placeholder="Descripción del juego...">${game?.description || ''}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Configuración de Ranking (JSON)</label>
        <textarea class="form-control" name="ranking_config" rows="4" 
                  placeholder='{"tiers": ["Bronze", "Silver", "Gold"], ...}'>${game?.ranking_config ? JSON.stringify(game.ranking_config, null, 2) : ''}</textarea>
        <small class="text-muted">Opcional: Configuración personalizada para el sistema de ranking</small>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-save"></i> ${isEdit ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  `;

  openModal(title, formHtml);

  // Auto-generate slug from name
  const nameInput = document.querySelector('input[name="name"]');
  const slugInput = document.querySelector('input[name="slug"]');
  
  if (!isEdit) {
    nameInput.addEventListener('input', (e) => {
      slugInput.value = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    });
  }

  document.getElementById('gameForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numeric fields
    data.release_year = data.release_year ? parseInt(data.release_year) : null;
    data.team_size = parseInt(data.team_size) || 5;

    // Parse ranking config JSON if provided
    if (data.ranking_config) {
      try {
        data.ranking_config = JSON.parse(data.ranking_config);
      } catch {
        showToast('error', 'Error', 'El JSON de configuración de ranking no es válido');
        return;
      }
    } else {
      delete data.ranking_config;
    }

    try {
      if (isEdit) {
        await API.games.update(game.id, data);
        showToast('success', 'Éxito', 'Juego actualizado correctamente');
      } else {
        await API.games.create(data);
        showToast('success', 'Éxito', 'Juego creado correctamente');
      }
      closeModal();
      const container = document.getElementById('pageContent');
      renderGames(container);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}

window.closeModal = closeModal;
