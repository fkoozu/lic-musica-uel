let calendarEvents = [];
let currentMonth = 1; // February (0-indexed)
let currentYear = 2026;

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
      
      // Make clickable
      cell.style.cursor = 'pointer';
      cell.addEventListener('click', () => showCalendarModal(dateStr, dayEvents));
      
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
  
  // Add events
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
