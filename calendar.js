let calendarEvents = [];
let schedule = [];
let selectedYear = 0; // 0 = all years, 1-5 = specific year
let currentMonth = 1; // Initialize to February (months are 0-indexed: 0=Jan, 1=Feb, 2=Mar, etc)
let currentYear = 2026;

// Load schedule from JSON file
fetch('schedule-2026-ANUAL.json')
  .then(res => res.json())
  .then(data => { 
    schedule = data;
    // Render schedule grid if it exists
    if (document.getElementById('scheduleGrid')) {
      renderScheduleGrid();
    }
  })
  .catch(err => console.error('Erro ao carregar horários:', err));

// Load events from JSON file
async function loadCalendarEvents() {
  try {
    const res = await fetch('./calendar-2026.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load calendar-2026.json');
    calendarEvents = await res.json();
    
    // Initialize with current month of 2026
    const now = new Date();
    currentMonth = now.getMonth();
    currentYear = 2026;
    
    renderCalendar(currentMonth, currentYear);
  } catch (err) {
    console.error('Error loading calendar:', err);
    const calendarDiv = document.getElementById('calendar');
    if (calendarDiv) {
      calendarDiv.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--muted);">
          <p>Erro ao carregar o calendário. Verifique se <code>calendar-2026.json</code> está disponível.</p>
        </div>
      `;
    }
  }
}

// Get events for a specific date
function getEventsForDate(dateStr) {
  return calendarEvents.filter(event => {
    if (event.date) {
      return event.date === dateStr;
    }
    if (event.start && event.end) {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const checkDate = new Date(dateStr);
      return checkDate >= eventStart && checkDate <= eventEnd;
    }
    return false;
  });
}

// Get primary event type for a day (priority order: exame > resultado > matricula > docente > letivo > evento)
function getPrimaryEventType(events) {
  const priority = ['exame', 'resultado', 'matricula', 'docente', 'letivo', 'evento'];
  for (const type of priority) {
    const found = events.find(e => e.type === type);
    if (found) return type;
  }
  return events.length > 0 ? events[0].type : null;
}

// Check if any event has marker: true
function hasMarker(events) {
  return events.some(e => e.marker === true);
}

// Format date for display (dd/mm/yyyy)
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format date with full weekday and month name
function formatFullDate(dateStr) {
  // Append T00:00:00 to force local timezone interpretation and avoid date shift
  const date = new Date(dateStr + 'T00:00:00');
  const weekdays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  
  const weekday = weekdays[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${weekday}, ${day} de ${month} de ${year}`;
}

// Render calendar for a specific month and year
function renderCalendar(month, year) {
  const calendarDiv = document.getElementById('calendar');
  const headerDiv = document.getElementById('calendar-header');
  
  if (!calendarDiv || !headerDiv) return;
  
  // Update header
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  headerDiv.textContent = `${months[month]} ${year}`;
  
  // Clear calendar
  calendarDiv.innerHTML = '';
  
  // Add day headers
  const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  dayHeaders.forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    calendarDiv.appendChild(header);
  });
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Add empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-cell calendar-cell--empty';
    calendarDiv.appendChild(emptyCell);
  }
  
  // Add cells for each day
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = getEventsForDate(dateStr);
    const weekday = new Date(dateStr + 'T00:00:00').getDay();
    
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    
    // Check if this is today
    if (dateStr === todayStr) {
      cell.classList.add('calendar-cell--today');
    }
    
    // Add event type class if there are events
    if (dayEvents.length > 0) {
      const primaryType = getPrimaryEventType(dayEvents);
      cell.classList.add(`cal-${primaryType}`);
      
      // Add event marker dot if any event has marker: true
      if (hasMarker(dayEvents)) {
        const dot = document.createElement('span');
        dot.className = 'event-dot';
        cell.appendChild(dot);
      }
      
      // Add event count badge if multiple events
      if (dayEvents.length > 1) {
        const count = document.createElement('span');
        count.className = 'event-count';
        count.textContent = dayEvents.length;
        cell.appendChild(count);
      }
    }
    
    // Make clickable if there are events OR if it's a weekday (Mon-Fri)
    if (dayEvents.length > 0 || (weekday >= 1 && weekday <= 5)) {
      cell.style.cursor = 'pointer';
      cell.addEventListener('click', () => showCalendarModal(dateStr, dayEvents));
    }
    
    // Add day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day;
    cell.insertBefore(dayNumber, cell.firstChild);
    
    calendarDiv.appendChild(cell);
  }
}

// Show modal with events for a specific day
function showCalendarModal(dateStr, events) {
  const modal = document.getElementById('calendarModal');
  const title = document.getElementById('calendarModal-title');
  const body = document.getElementById('calendarModal-body');
  
  if (!modal || !title || !body) return;
  
  // Set title
  title.textContent = formatFullDate(dateStr);
  
  // Clear body
  body.innerHTML = '';
  
  // Add events first (if any)
  events.forEach(event => {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'calModal-event';
    
    // Event header with badges
    const headerDiv = document.createElement('div');
    headerDiv.style.display = 'flex';
    headerDiv.style.gap = '8px';
    headerDiv.style.marginBottom = '8px';
    headerDiv.style.flexWrap = 'wrap';
    
    // Type badge
    const typeBadge = document.createElement('span');
    typeBadge.className = `calModal-badge calModal-badge--${event.type}`;
    typeBadge.textContent = event.type.charAt(0).toUpperCase() + event.type.slice(1);
    headerDiv.appendChild(typeBadge);
    
    // Tag badge (if present)
    if (event.tag) {
      const tagBadge = document.createElement('span');
      tagBadge.className = 'calModal-tag';
      tagBadge.textContent = event.tag;
      headerDiv.appendChild(tagBadge);
    }
    
    eventDiv.appendChild(headerDiv);
    
    // Event title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'calModal-event-title';
    titleDiv.textContent = event.title;
    eventDiv.appendChild(titleDiv);
    
    // Event description
    const descDiv = document.createElement('div');
    descDiv.className = 'calModal-event-desc';
    descDiv.textContent = event.description;
    eventDiv.appendChild(descDiv);
    
    // Date range (if applicable)
    if (event.start && event.end) {
      const rangeDiv = document.createElement('div');
      rangeDiv.className = 'calModal-event-range';
      rangeDiv.textContent = `📅 ${formatDate(event.start)} até ${formatDate(event.end)}`;
      eventDiv.appendChild(rangeDiv);
    }
    
    body.appendChild(eventDiv);
  });
  
  // Get weekday and add schedule section (if weekday is Mon-Fri)
  const date = new Date(dateStr + 'T00:00:00');
  const weekday = date.getDay();
  
  if (weekday >= 1 && weekday <= 5 && schedule.length > 0) {
    const weekdayNames = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    
    // Add separator if there are events
    if (events.length > 0) {
      const separator = document.createElement('hr');
      separator.style.margin = '16px 0';
      separator.style.border = 'none';
      separator.style.borderTop = '1px solid var(--line)';
      body.appendChild(separator);
    }
    
    // Schedule section
    const scheduleSection = document.createElement('div');
    scheduleSection.className = 'calModal-schedule';
    
    // Schedule title
    const scheduleTitle = document.createElement('h4');
    scheduleTitle.className = 'calModal-schedule-title';
    scheduleTitle.textContent = `📚 Horário de Aulas — ${weekdayNames[weekday]}`;
    scheduleSection.appendChild(scheduleTitle);
    
    // Year filter buttons
    const filterDiv = document.createElement('div');
    filterDiv.className = 'calModal-schedule-filter';
    
    const years = [
      { value: 0, label: 'Todos' },
      { value: 1, label: '1º Ano' },
      { value: 2, label: '2º Ano' },
      { value: 3, label: '3º Ano' },
      { value: 4, label: '4º Ano' },
      { value: 5, label: '5º Ano' }
    ];
    
    years.forEach(y => {
      const btn = document.createElement('button');
      btn.className = 'schedule-year-btn';
      if (y.value === selectedYear) {
        btn.classList.add('schedule-year-btn--active');
      }
      btn.textContent = y.label;
      btn.onclick = () => {
        selectedYear = y.value;
        // Update all buttons
        filterDiv.querySelectorAll('.schedule-year-btn').forEach(b => {
          b.classList.remove('schedule-year-btn--active');
        });
        btn.classList.add('schedule-year-btn--active');
        // Re-render schedule in modal
        showCalendarModal(dateStr, events);
        // Also update the main schedule grid if it exists
        if (document.getElementById('scheduleGrid')) {
          renderScheduleGrid();
        }
        // Update standalone filter buttons if they exist
        document.querySelectorAll('#scheduleFilter .schedule-year-btn').forEach(b => {
          b.classList.toggle('schedule-year-btn--active', parseInt(b.dataset.year) === selectedYear);
        });
      };
      filterDiv.appendChild(btn);
    });
    
    scheduleSection.appendChild(filterDiv);
    
    // Get schedule entries for this weekday
    const daySchedule = schedule.filter(s => 
      s.weekday === weekday && 
      (selectedYear === 0 || s.year === selectedYear)
    );
    
    if (daySchedule.length === 0) {
      const noSchedule = document.createElement('p');
      noSchedule.className = 'muted';
      noSchedule.style.marginTop = '12px';
      noSchedule.textContent = 'Nenhuma aula encontrada para o filtro selecionado.';
      scheduleSection.appendChild(noSchedule);
    } else {
      // Group by time
      const timeGroups = {};
      daySchedule.forEach(s => {
        if (!timeGroups[s.time]) {
          timeGroups[s.time] = [];
        }
        timeGroups[s.time].push(s);
      });
      
      // Sort times
      const times = Object.keys(timeGroups).sort();
      
      times.forEach(time => {
        const timeGroup = document.createElement('div');
        timeGroup.className = 'schedule-time-group';
        
        const timeLabel = document.createElement('span');
        timeLabel.className = 'schedule-time-label';
        timeLabel.textContent = time;
        timeGroup.appendChild(timeLabel);
        
        timeGroups[time].forEach(entry => {
          const entryDiv = document.createElement('div');
          entryDiv.className = 'schedule-entry';
          
          const yearBadge = document.createElement('span');
          yearBadge.className = 'schedule-year-badge';
          yearBadge.textContent = `${entry.year}º`;
          entryDiv.appendChild(yearBadge);
          
          const disciplineName = document.createElement('strong');
          disciplineName.textContent = entry.discipline;
          entryDiv.appendChild(disciplineName);
          
          if (entry.professor || entry.room) {
            const details = document.createElement('span');
            details.className = 'schedule-detail';
            const parts = [];
            if (entry.professor) parts.push(`Prof. ${entry.professor}`);
            if (entry.room) parts.push(`Sala ${entry.room}`);
            details.textContent = parts.join(' · ');
            entryDiv.appendChild(details);
          }
          
          if (entry.code) {
            const code = document.createElement('span');
            code.className = 'schedule-code';
            code.textContent = entry.code;
            entryDiv.appendChild(code);
          }
          
          timeGroup.appendChild(entryDiv);
        });
        
        scheduleSection.appendChild(timeGroup);
      });
    }
    
    body.appendChild(scheduleSection);
  }
  
  // Show modal
  modal.classList.add('calendarModal--visible');
}

// Close modal
function closeCalendarModal() {
  const modal = document.getElementById('calendarModal');
  if (modal) {
    modal.classList.remove('calendarModal--visible');
  }
}

// Navigate to previous month
function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentMonth, currentYear);
}

// Navigate to next month
function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentMonth, currentYear);
}

// Go to today
function goToday() {
  const now = new Date();
  currentMonth = now.getMonth();
  currentYear = now.getFullYear();
  renderCalendar(currentMonth, currentYear);
}

// Filter schedule by year
function filterSchedule(year) {
  selectedYear = year;
  // Update button active states
  document.querySelectorAll('.schedule-year-btn').forEach(btn => {
    btn.classList.toggle('schedule-year-btn--active', parseInt(btn.dataset.year) === year);
  });
  renderScheduleGrid();
}

// Render schedule grid
function renderScheduleGrid() {
  const grid = document.getElementById('scheduleGrid');
  if (!grid || !schedule.length) return;
  
  const weekdays = [
    { num: 1, name: 'Segunda' },
    { num: 2, name: 'Terça' },
    { num: 3, name: 'Quarta' },
    { num: 4, name: 'Quinta' },
    { num: 5, name: 'Sexta' }
  ];
  const times = ['14:00', '16:00'];
  
  // Build HTML table
  let html = '<div class="schedule-table">';
  
  // Header row
  html += '<div class="schedule-table-row schedule-table-header">';
  html += '<div class="schedule-table-cell schedule-table-time-header">Horário</div>';
  weekdays.forEach(w => {
    html += `<div class="schedule-table-cell schedule-table-day-header">${w.name}</div>`;
  });
  html += '</div>';
  
  // Time rows
  times.forEach(time => {
    html += '<div class="schedule-table-row">';
    html += `<div class="schedule-table-cell schedule-table-time">${time}</div>`;
    
    weekdays.forEach(w => {
      const entries = schedule.filter(s => 
        s.weekday === w.num && 
        s.time === time && 
        (selectedYear === 0 || s.year === selectedYear)
      );
      
      html += '<div class="schedule-table-cell">';
      entries.forEach(e => {
        const yearColors = { 1: '#4caf50', 2: '#2196f3', 3: '#9c27b0', 4: '#ff9800', 5: '#f44336' };
        html += `
          <div class="schedule-card" style="border-left: 3px solid ${yearColors[e.year] || '#ccc'}">
            <span class="schedule-card-year">${e.year}º</span>
            <strong class="schedule-card-name">${e.discipline}</strong>
            ${e.professor ? `<span class="schedule-card-prof">${e.professor}</span>` : ''}
            ${e.room ? `<span class="schedule-card-room">📍 ${e.room}</span>` : ''}
            ${e.code ? `<span class="schedule-card-code">${e.code}</span>` : ''}
          </div>
        `;
      });
      html += '</div>';
    });
    
    html += '</div>';
  });
  
  html += '</div>';
  grid.innerHTML = html;
}

// Close modal on click outside
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('calendarModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCalendarModal();
      }
    });
  }
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCalendarModal();
    }
  });
  
  // Load calendar events
  loadCalendarEvents();
});
