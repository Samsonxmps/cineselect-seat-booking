/**
 * script.js  –  Cinema Seat Selection
 *
 * Responsibilities:
 *  1. Build the seat grid dynamically (6 rows × 8 seats).
 *  2. Mark pre-booked seats as disabled from the start.
 *  3. Handle click events: toggle seats between Available ↔ Selected.
 *  4. Update the booking summary panel (seat list, count, price) on every click.
 *  5. Reset Selection  – deselects all currently selected seats.
 *  6. Confirm Booking  – marks selected seats as permanently booked.
 */

/* ============================================================
   CONFIGURATION  (easy to change without touching any other code)
   ============================================================ */

/** Ticket price in Indian Rupees */
const PRICE_PER_SEAT = 250;

/**
 * Rows A–F, each with 8 seats.
 * Row letters serve as the first part of a seat ID (e.g. "A3").
 */
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Total seats per row */
const SEATS_PER_ROW = 8;

/**
 * Pre-booked seats (10 realistic ones spread across different rows).
 * These will get the HTML `disabled` attribute and cannot be selected.
 */
const PRE_BOOKED = new Set([
  'A2', 'A5',
  'B4', 'B6',
  'C1', 'C7',
  'D3', 'D5',
  'E8',
  'F2'
]);

/* ============================================================
   STATE
   ============================================================ */

/**
 * selectedSeats keeps track of seats the user has clicked (not yet confirmed).
 * We use a Set so IDs are automatically unique and easy to add/remove.
 * @type {Set<string>}
 */
const selectedSeats = new Set();

/* ============================================================
   DOM REFERENCES  (resolved once after the page loads)
   ============================================================ */
const seatContainer    = document.getElementById('seatContainer');
const selectedSeatsEl  = document.getElementById('selectedSeats');
const seatCountEl      = document.getElementById('seatCount');
const totalPriceEl     = document.getElementById('totalPrice');
const resetBtn         = document.getElementById('resetBtn');
const confirmBtn       = document.getElementById('confirmBtn');
const confirmationMsg  = document.getElementById('confirmationMsg');

/* ============================================================
   1.  BUILD THE SEAT GRID
   ============================================================ */

/**
 * Generates every seat row and injects them into #seatContainer.
 * Each row is a <div class="seat-row"> containing:
 *   • a row-label <span>
 *   • 8 <button> elements  (with an empty <span> as the aisle gap after seat 4)
 */
function buildSeatGrid() {
  ROW_LABELS.forEach(rowLetter => {

    /* -- Create the row container -- */
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('seat-row');
    rowDiv.setAttribute('aria-label', `Row ${rowLetter}`);

    /* -- Row label (A, B, C …) -- */
    const label = document.createElement('span');
    label.classList.add('row-label');
    label.textContent = rowLetter;
    label.setAttribute('aria-hidden', 'true'); // already in aria-label above
    rowDiv.appendChild(label);

    /* -- 8 seat buttons -- */
    for (let seatNum = 1; seatNum <= SEATS_PER_ROW; seatNum++) {

      /* Insert the aisle gap between seat 4 and seat 5 */
      if (seatNum === 5) {
        const gap = document.createElement('span');
        gap.classList.add('aisle-gap');
        gap.setAttribute('aria-hidden', 'true');
        rowDiv.appendChild(gap);
      }

      const seatId = `${rowLetter}${seatNum}`;   // e.g. "A3"
      const isPreBooked = PRE_BOOKED.has(seatId);

      /* Create the <button> */
      const btn = document.createElement('button');
      btn.classList.add('seat');
      btn.dataset.seatId = seatId;               // used in event handler
      btn.setAttribute('aria-label', `Seat ${seatId}`);

      if (isPreBooked) {
        /* Booked seats: disabled, different style, show ✕ symbol */
        btn.classList.add('booked');
        btn.disabled = true;
        btn.textContent = '✕';
        btn.setAttribute('aria-label', `Seat ${seatId} – already booked`);
      } else {
        /* Available seats: show the seat number */
        btn.classList.add('available');
        btn.textContent = seatId;
        /* Attach the toggle listener (only needed on interactive seats) */
        btn.addEventListener('click', handleSeatClick);
      }

      rowDiv.appendChild(btn);
    }

    seatContainer.appendChild(rowDiv);
  });
}

/* ============================================================
   2.  SEAT CLICK HANDLER  –  toggle Available ↔ Selected
   ============================================================ */

/**
 * Called whenever a user clicks an available or selected seat.
 * Reads the seat ID from data-seatId, toggles its CSS class and
 * its presence in the selectedSeats Set, then refreshes the summary.
 * @param {MouseEvent} event
 */
function handleSeatClick(event) {
  const btn    = event.currentTarget;
  const seatId = btn.dataset.seatId;

  /* Clear any previous confirmation message when the user interacts */
  hideMessage();

  if (btn.classList.contains('selected')) {
    /* ---- DE-SELECT: change back to available ---- */
    btn.classList.remove('selected');
    btn.classList.add('available');
    btn.textContent = seatId;             // restore seat-number label
    btn.setAttribute('aria-label', `Seat ${seatId}`);
    btn.setAttribute('aria-pressed', 'false');
    selectedSeats.delete(seatId);
  } else {
    /* ---- SELECT: mark as selected ---- */
    btn.classList.remove('available');
    btn.classList.add('selected');
    btn.textContent = '✓';               // checkmark symbol for selected state
    btn.setAttribute('aria-label', `Seat ${seatId} – selected`);
    btn.setAttribute('aria-pressed', 'true');
    selectedSeats.add(seatId);
  }

  updateSummary();   // refresh the right-hand panel
}

/* ============================================================
   3.  UPDATE BOOKING SUMMARY PANEL
   ============================================================ */

/**
 * Reads selectedSeats and updates the three summary fields:
 *  • List of seat IDs (sorted alphabetically / numerically)
 *  • Count of seats
 *  • Total price in ₹
 */
function updateSummary() {
  /* Sort seats: first by row letter (A→F), then by number (1→8) */
  const sortedSeats = [...selectedSeats].sort((a, b) => {
    /* Compare row letters first */
    if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
    /* Then compare seat numbers numerically */
    return parseInt(a.slice(1)) - parseInt(b.slice(1));
  });

  const count      = sortedSeats.length;
  const totalPrice = count * PRICE_PER_SEAT;

  /* Update DOM */
  selectedSeatsEl.textContent = count > 0 ? sortedSeats.join(', ') : 'None';
  seatCountEl.textContent     = count;
  totalPriceEl.textContent    = `₹${totalPrice.toLocaleString('en-IN')}`;
}

/* ============================================================
   4.  RESET SELECTION
   ============================================================ */

/**
 * Deselects every currently-selected seat (reverts to Available state).
 * Does NOT affect pre-booked or confirmed-booked seats.
 */
function resetSelection() {
  /* For each selected seat ID, find its button and revert */
  selectedSeats.forEach(seatId => {
    const btn = document.querySelector(`[data-seat-id="${seatId}"]`);
    if (btn) {
      btn.classList.remove('selected');
      btn.classList.add('available');
      btn.textContent = seatId;
      btn.setAttribute('aria-label', `Seat ${seatId}`);
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  selectedSeats.clear();   // empty the tracking set
  updateSummary();
  hideMessage();
}

/* ============================================================
   5.  CONFIRM BOOKING
   ============================================================ */

/**
 * Permanently books the selected seats:
 *  • Removes the click listener (so they can't be un-selected).
 *  • Marks the button as disabled with the booked style and ✕ label.
 *  • Clears the selection and shows a success message.
 */
function confirmBooking() {
  if (selectedSeats.size === 0) {
    /* Nothing selected – show an error nudge */
    showMessage('⚠️ Please select at least one seat before confirming.', 'error');
    return;
  }

  /* Capture the seat list (and total) before clearing */
  const bookedList = [...selectedSeats].sort((a, b) => {
    if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
    return parseInt(a.slice(1)) - parseInt(b.slice(1));
  });
  const totalPaid = bookedList.length * PRICE_PER_SEAT;

  /* Mark each selected seat as permanently booked */
  selectedSeats.forEach(seatId => {
    const btn = document.querySelector(`[data-seat-id="${seatId}"]`);
    if (btn) {
      /* Remove the click handler first (cleanest approach) */
      btn.removeEventListener('click', handleSeatClick);

      /* Apply booked visual state */
      btn.classList.remove('selected', 'available');
      btn.classList.add('booked');
      btn.disabled = true;
      btn.textContent = '✕';
      btn.setAttribute('aria-label', `Seat ${seatId} – booked`);
      btn.setAttribute('aria-pressed', 'false');

      /* Add to our PRE_BOOKED set so future resets don't affect it */
      PRE_BOOKED.add(seatId);
    }
  });

  /* Clear selection tracking */
  selectedSeats.clear();
  updateSummary();

  /* Show success message */
  showMessage(
    `🎉 Booking confirmed!\n` +
    `Seats: ${bookedList.join(', ')}\n` +
    `Total paid: ₹${totalPaid.toLocaleString('en-IN')}`,
    'success'
  );
}

/* ============================================================
   6.  HELPER: Show / Hide Confirmation Message
   ============================================================ */

/**
 * Shows a styled message below the action buttons.
 * @param {string} text    – the message to display
 * @param {'success'|'error'} type – controls colour styling
 */
function showMessage(text, type) {
  /* Remove previous type classes */
  confirmationMsg.classList.remove('show', 'success', 'error');

  /* Use a tiny timeout so the CSS animation re-triggers even for the same type */
  void confirmationMsg.offsetWidth;   // force reflow

  confirmationMsg.textContent = text;
  confirmationMsg.classList.add('show', type);
}

/** Hides the confirmation message */
function hideMessage() {
  confirmationMsg.classList.remove('show', 'success', 'error');
}

/* ============================================================
   7.  BUTTON EVENT LISTENERS
   ============================================================ */

resetBtn.addEventListener('click', resetSelection);
confirmBtn.addEventListener('click', confirmBooking);

/* ============================================================
   8.  INITIALISE  –  build the grid when the script first runs
   ============================================================ */
buildSeatGrid();
updateSummary();   // set initial summary state ("None", 0 seats, ₹0)
