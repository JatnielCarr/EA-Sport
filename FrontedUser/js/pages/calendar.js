// =====================================================
// Tournament Calendar Page
// =====================================================

import API from '../api.js';

export async function renderCalendar(container) {
    const now = new Date();
    let currentYear = now.getFullYear();
    let currentMonth = now.getMonth();

    container.innerHTML = buildCalendarShell(currentYear, currentMonth);

    let tournaments = [];
    try {
        const res = await API.tournaments.getAll();
        tournaments = (res.data || res || []).filter(t => t.start_date);
    } catch (e) {
        console.error('Error loading tournaments for calendar:', e);
    }

    renderMonth(currentYear, currentMonth, tournaments);

    document.getElementById('calPrev')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderMonth(currentYear, currentMonth, tournaments);
    });

    document.getElementById('calNext')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderMonth(currentYear, currentMonth, tournaments);
    });
}

function buildCalendarShell() {
    return `
    <div class="calendar-page">
        <div class="content-header">
            <h1><i class="fas fa-calendar-alt"></i> Calendario de Torneos</h1>
            <p>Visualiza todos los torneos próximos</p>
        </div>

        <div class="cal-nav">
            <button class="cal-btn" id="calPrev"><i class="fas fa-chevron-left"></i></button>
            <h2 id="calMonthTitle"></h2>
            <button class="cal-btn" id="calNext"><i class="fas fa-chevron-right"></i></button>
        </div>

        <div class="cal-grid">
            <div class="cal-header">Dom</div>
            <div class="cal-header">Lun</div>
            <div class="cal-header">Mar</div>
            <div class="cal-header">Mié</div>
            <div class="cal-header">Jue</div>
            <div class="cal-header">Vie</div>
            <div class="cal-header">Sáb</div>
        </div>
        <div class="cal-grid" id="calDays"></div>

        <div class="cal-upcoming" id="calUpcoming"></div>
    </div>

    <style>
        .calendar-page { max-width: 900px; margin: 0 auto; }
        .cal-nav { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px; }
        .cal-nav h2 { min-width: 200px; text-align: center; font-size: 18px; text-transform: capitalize; }
        .cal-btn { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); padding: 10px 14px; cursor: pointer; }
        .cal-btn:hover { border-color: var(--primary); }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 4px; }
        .cal-header { text-align: center; font-size: 12px; font-weight: 700; color: var(--text-muted); padding: 8px; text-transform: uppercase; }
        .cal-day {
            min-height: 80px; background: var(--bg-card); border: 1px solid var(--border-color);
            border-radius: 10px; padding: 8px; font-size: 12px; cursor: pointer;
            transition: border-color 0.2s;
        }
        .cal-day:hover { border-color: var(--primary); }
        .cal-day.today { border-color: var(--primary); background: rgba(0,212,255,0.05); }
        .cal-day.empty { background: transparent; border-color: transparent; cursor: default; }
        .cal-day-num { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
        .cal-event {
            display: block; padding: 2px 6px; border-radius: 4px;
            font-size: 10px; font-weight: 600; margin-bottom: 2px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cal-event.registration { background: rgba(0,212,255,0.2); color: #00d4ff; }
        .cal-event.in_progress { background: rgba(0,255,136,0.2); color: #00ff88; }
        .cal-event.upcoming { background: rgba(255,184,0,0.2); color: #ffb800; }
        .cal-event.completed { background: rgba(138,43,226,0.2); color: #8a2be2; }
        .cal-upcoming { margin-top: 24px; }
        .cal-upcoming h3 { font-size: 16px; margin-bottom: 14px; }
        .cal-upcoming h3 i { color: var(--primary); margin-right: 8px; }
        .cal-upcoming-item {
            display: flex; align-items: center; justify-content: space-between;
            background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
            padding: 14px 18px; margin-bottom: 10px;
        }
        .cal-upcoming-item:hover { border-color: var(--primary); }
        .cui-left { display: flex; align-items: center; gap: 12px; }
        .cui-date { text-align: center; background: var(--bg-tertiary); border-radius: 10px; padding: 6px 12px; min-width: 50px; }
        .cui-date .day { font-size: 20px; font-weight: 900; font-family: 'Orbitron', mono; display: block; }
        .cui-date .month { font-size: 10px; color: var(--text-muted); text-transform: uppercase; }
        .cui-info h4 { margin: 0 0 4px; font-size: 14px; }
        .cui-info p { margin: 0; font-size: 12px; color: var(--text-muted); }
        @media (max-width: 640px) { .cal-day { min-height: 50px; padding: 4px; } .cal-event { display: none; } }
    </style>
    `;
}

function renderMonth(year, month, tournaments) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('calMonthTitle').textContent = `${months[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Group tournaments by day
    const eventsByDay = {};
    tournaments.forEach(t => {
        const d = new Date(t.start_date);
        if (d.getFullYear() === year && d.getMonth() === month) {
            const day = d.getDate();
            if (!eventsByDay[day]) eventsByDay[day] = [];
            eventsByDay[day].push(t);
        }
    });

    let html = '';

    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="cal-day empty"></div>';
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
        const events = eventsByDay[d] || [];
        html += `
            <div class="cal-day ${isToday ? 'today' : ''}">
                <div class="cal-day-num">${d}</div>
                ${events.slice(0, 2).map(e => {
                    const cls = getEventClass(e.status);
                    return `<a href="#/torneos/${e.slug || e.id}" class="cal-event ${cls}">${e.name}</a>`;
                }).join('')}
                ${events.length > 2 ? `<span class="cal-event upcoming">+${events.length - 2} más</span>` : ''}
            </div>
        `;
    }

    document.getElementById('calDays').innerHTML = html;

    // Upcoming list
    const upcoming = tournaments
        .filter(t => new Date(t.start_date) >= today)
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        .slice(0, 5);

    document.getElementById('calUpcoming').innerHTML = `
        <h3><i class="fas fa-clock"></i> Próximos Torneos</h3>
        ${upcoming.length === 0 ? '<p style="color:var(--text-muted);">No hay torneos próximos</p>' : ''}
        ${upcoming.map(t => {
            const d = new Date(t.start_date);
            return `
                <a href="#/torneos/${t.slug || t.id}" class="cal-upcoming-item">
                    <div class="cui-left">
                        <div class="cui-date">
                            <span class="day">${d.getDate()}</span>
                            <span class="month">${months[d.getMonth()].slice(0, 3)}</span>
                        </div>
                        <div class="cui-info">
                            <h4>${t.name}</h4>
                            <p>${t.format || ''} · ${t.max_participants || '?'} equipos · $${Number(t.prize_pool || 0).toFixed(0)} MXN</p>
                        </div>
                    </div>
                    <span class="cal-event ${getEventClass(t.status)}" style="flex-shrink:0;">${getStatusLabel(t.status)}</span>
                </a>
            `;
        }).join('')}
    `;
}

function getEventClass(status) {
    const map = {
        'REGISTRATION_OPEN': 'registration',
        'IN_PROGRESS': 'in_progress',
        'COMPLETED': 'completed',
        'PUBLISHED': 'upcoming',
        'DRAFT': 'upcoming',
    };
    return map[status] || 'upcoming';
}

function getStatusLabel(status) {
    const map = {
        'REGISTRATION_OPEN': 'Inscripción',
        'IN_PROGRESS': 'En curso',
        'COMPLETED': 'Finalizado',
        'PUBLISHED': 'Próximo',
        'DRAFT': 'Borrador',
    };
    return map[status] || status;
}
