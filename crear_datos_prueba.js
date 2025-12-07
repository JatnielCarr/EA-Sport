// Script para crear datos de prueba
// Ejecutar en la consola del navegador cuando esté en la app

async function crearDatosDePrueba() {
    const API_BASE = 'http://localhost:3000';

    // Función helper para hacer peticiones
    async function apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.body = JSON.stringify(data);
        const res = await fetch(`${API_BASE}${endpoint}`, options);
        return res.json();
    }

    console.log('🎮 Creando juegos...');

    // Crear juegos
    const juegos = [
        { name: 'Clash Royale', slug: 'clash-royale', developer: 'Supercell', team_size_default: 1 },
        { name: 'League of Legends', slug: 'lol', developer: 'Riot Games', team_size_default: 5 },
        { name: 'Valorant', slug: 'valorant', developer: 'Riot Games', team_size_default: 5 },
        { name: 'FIFA 25', slug: 'fifa25', developer: 'EA Sports', team_size_default: 1 }
    ];

    for (const juego of juegos) {
        try {
            await apiCall('/games', 'POST', juego);
            console.log(`✅ Juego creado: ${juego.name}`);
        } catch (e) {
            console.log(`⚠️ Juego ya existe: ${juego.name}`);
        }
    }

    // Obtener juegos
    const gamesRes = await apiCall('/games');
    const games = gamesRes.data || [];
    const clashRoyale = games.find(g => g.slug === 'clash-royale' || g.name.includes('Clash'));

    if (!clashRoyale) {
        console.error('❌ No se encontró el juego Clash Royale');
        return;
    }

    console.log('🏆 Creando torneo...');

    // Obtener usuarios para usar como organizador
    const usersRes = await apiCall('/users');
    const users = usersRes.data || [];
    const organizer = users[0];

    if (!organizer) {
        console.error('❌ No hay usuarios disponibles');
        return;
    }

    // Crear torneo
    const torneo = {
        name: 'Clash Royale World Finals 2025',
        slug: 'clash-royale-wf-2025',
        description: 'Mundial de Clash Royale con los mejores jugadores',
        game_id: clashRoyale.id,
        organizer_id: organizer.id,
        format: 'DOUBLE_ELIMINATION',
        team_size: 1,
        max_participants: 16,
        region: 'GLOBAL',
        entry_fee: 0,
        prize_pool: 50000,
        start_date: new Date('2025-12-20T18:00:00Z').toISOString(),
        registration_deadline: new Date('2025-12-15T23:59:59Z').toISOString(),
        status: 'REGISTRATION_OPEN'
    };

    let tournament;
    try {
        const torneoRes = await apiCall('/tournaments', 'POST', torneo);
        tournament = torneoRes.data;
        console.log(`✅ Torneo creado: ${torneo.name}`);
    } catch (e) {
        console.log('⚠️ Torneo ya existe, buscando...');
        const tournamentsRes = await apiCall('/tournaments');
        tournament = (tournamentsRes.data || []).find(t => t.slug === torneo.slug);
    }

    if (!tournament) {
        console.error('❌ No se pudo crear/encontrar el torneo');
        return;
    }

    console.log('👥 Creando equipos/jugadores...');

    // Nombres de equipos de la imagen
    const equipos = [
        { name: 'KHAZARDY', tag: 'KHZ' },
        { name: 'CAL SANDBOX', tag: 'CAL' },
        { name: 'FRONTIER GUARD', tag: 'FG' },
        { name: 'VITOR75', tag: 'VIT' },
        { name: 'ADRIEL', tag: 'ADR' },
        { name: 'MUGI', tag: 'MUG' },
        { name: 'LUCASXGAMER', tag: 'LXG' },
        { name: 'SK XDPXSAM', tag: 'SKX' },
        { name: 'MOHAMED LIGHT', tag: 'MLT' },
        { name: 'IAN77', tag: 'IAN' },
        { name: 'PEDROTM', tag: 'PTM' },
        { name: 'CAL SUB', tag: 'CSB' }
    ];

    for (let i = 0; i < equipos.length; i++) {
        const equipo = equipos[i];
        const captain = users[i % users.length]; // Rotar capitanes

        try {
            await apiCall('/teams', 'POST', {
                tournament_id: tournament.id,
                name: equipo.name,
                tag: equipo.tag,
                captain_id: captain.id
            });
            console.log(`✅ Equipo creado: ${equipo.name}`);
        } catch (e) {
            console.log(`⚠️ Error creando equipo ${equipo.name}: ${e.message}`);
        }
    }

    console.log('');
    console.log('🎉 ¡Datos de prueba creados!');
    console.log('📋 Ahora ve a la página de Brackets, selecciona el torneo y genera el bracket');
}

// Ejecutar
crearDatosDePrueba();
