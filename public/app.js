/* =========================================================
   Bright Smile Dental — AI Voice Receptionist
   Client Application
   ========================================================= */

(function () {
  'use strict';

  /* ── Configuration ─────────────────────────────────── */
  var CLINIC_NAME = 'Bright Smile Dental';
  var VAPI_PUBLIC_KEY = '01959e46-447f-4f90-872d-fa4bc262a8f4';
  var WEBHOOK_URL = window.location.origin + '/api/vapi-webhook';

  /* ── State ─────────────────────────────────────────── */
  var CallState = { IDLE: 'idle', CONNECTING: 'connecting', ACTIVE: 'active', ENDED: 'ended' };
  var currentState = CallState.IDLE;
  var vapiInstance = null;
  var callTimerInterval = null;
  var callStartTime = null;
  var bookingDetected = null;

  /* ── DOM References ────────────────────────────────── */
  var dom = {
    stateIdle: document.getElementById('state-idle'),
    stateConnecting: document.getElementById('state-connecting'),
    stateActive: document.getElementById('state-active'),
    stateEnded: document.getElementById('state-ended'),
    btnStartCall: document.getElementById('btn-start-call'),
    btnEndCall: document.getElementById('btn-end-call'),
    btnNewCall: document.getElementById('btn-new-call'),
    callTimer: document.getElementById('call-timer'),
    callDurationSummary: document.getElementById('call-duration-summary'),
    transcriptBody: document.getElementById('transcript-body'),
    transcriptEmpty: document.getElementById('transcript-empty'),
    transcriptBadge: document.getElementById('transcript-badge'),
    confirmationCard: document.getElementById('confirmation-card'),
    confirmationDetails: document.getElementById('confirmation-details'),
    navReceptionist: document.getElementById('nav-receptionist'),
    navDashboard: document.getElementById('nav-dashboard'),
    viewReceptionist: document.getElementById('view-receptionist'),
    viewDashboard: document.getElementById('view-dashboard'),
    statCalls: document.getElementById('stat-calls'),
    statAppointments: document.getElementById('stat-appointments'),
    statLeads: document.getElementById('stat-leads'),
    appointmentsBody: document.getElementById('appointments-body'),
    leadsBody: document.getElementById('leads-body'),
    btnRefreshAppointments: document.getElementById('btn-refresh-appointments'),
    btnRefreshLeads: document.getElementById('btn-refresh-leads'),
  };

  /* ── System Prompt ─────────────────────────────────── */
  var SYSTEM_PROMPT = [
    'You are the virtual receptionist for ' + CLINIC_NAME + '. You answer the phone like a friendly, experienced dental office receptionist.',
    '',
    'PERSONALITY',
    '- Keep every response to one or two sentences maximum',
    '- Sound natural. Use fillers occasionally: "Sure", "Of course", "Got it", "Alright"',
    '- Never repeat yourself',
    '- Never list more than two or three options at once',
    '- Never use medical jargon or technical language',
    '',
    'BOOKING FLOW — follow these steps in order:',
    '1. Ask what they would like to book: "What can I help you schedule today?"',
    '2. Once you know the service, ask: "What day works best for you?"',
    '3. Call the check_availability tool with the service and date',
    '4. Offer the available times naturally: "We have nine AM or two PM open. Which works better?"',
    '5. After they pick a time, ask: "Can I get your full name?"',
    '6. Then ask: "And a phone number where we can reach you?"',
    '7. Call the book_appointment tool with all the collected details',
    '8. Confirm: "You are all set! I have booked your [service] on [date] at [time]. We will see you then!"',
    '',
    'EMERGENCY HANDLING',
    'If the caller mentions pain, bleeding, swelling, broken tooth, knocked out tooth, cracked tooth, abscess, infection, or the word "emergency":',
    '- Respond with concern: "I am sorry to hear that."',
    '- Try to book the earliest available slot immediately',
    '- If nothing available: "Let me connect you directly to our front desk so we can get you in right away."',
    '',
    'CLINIC INFORMATION',
    'Name: ' + CLINIC_NAME,
    'Address: 123 Dental Way, Suite 200, Austin, TX 78701',
    'Phone: (512) 555-0123',
    'Hours: Monday through Friday, 8 AM to 5 PM. Closed weekends.',
    'Services: Cleanings, Checkups, Fillings, Whitening, Emergency care',
    '',
    'SAFETY RULES',
    '- Only share information listed above',
    '- If unsure: "I do not have that information, but I can have someone call you back."',
    '- Never give medical advice or diagnose',
    '- Never make up services, prices, or hours',
    '- If a system error occurs: "I am having trouble with that. Let me connect you to our front desk."',
    '- If the caller is confused or frustrated: "Would you like me to transfer you to our front desk?"',
    '',
    'FALLBACK',
    'When you cannot help: "Let me connect you to our front desk so they can help."',
  ].join('\n');

  /* ── Tool Definitions ──────────────────────────────── */
  var TOOL_DEFINITIONS = [
    {
      type: 'function',
      function: {
        name: 'check_availability',
        description: 'Check available appointment slots for a given service and date.',
        parameters: {
          type: 'object',
          properties: {
            appointmentType: { type: 'string', description: 'Type of dental service: cleaning, checkup, filling, whitening, or emergency' },
            preferredDate: { type: 'string', description: 'Date in YYYY-MM-DD format' },
            timezone: { type: 'string', default: 'America/New_York' }
          },
          required: ['appointmentType', 'preferredDate']
        }
      },
      server: { url: WEBHOOK_URL }
    },
    {
      type: 'function',
      function: {
        name: 'book_appointment',
        description: 'Book a confirmed appointment after collecting all required patient details.',
        parameters: {
          type: 'object',
          properties: {
            service: { type: 'string', description: 'The dental service being booked' },
            date: { type: 'string', description: 'Appointment date in YYYY-MM-DD format' },
            time: { type: 'string', description: 'Appointment time, e.g. 9:00 AM' },
            patientName: { type: 'string', description: 'Full name of the patient' },
            patientPhone: { type: 'string', description: 'Patient phone number' }
          },
          required: ['service', 'date', 'time', 'patientName', 'patientPhone']
        }
      },
      server: { url: WEBHOOK_URL }
    },
    {
      type: 'function',
      function: {
        name: 'capture_caller_info',
        description: 'Save caller information for follow-up when an appointment cannot be booked immediately.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Caller name' },
            phone: { type: 'string', description: 'Caller phone number' },
            reason: { type: 'string', description: 'Brief description of why they called' }
          },
          required: ['name', 'phone', 'reason']
        }
      },
      server: { url: WEBHOOK_URL }
    }
  ];

  /* ── Initialize Vapi ───────────────────────────────── */
  function waitForVapi(callback) {
    if (window.vapiSDK) {
      callback();
    } else {
      var attempts = 0;
      var check = setInterval(function () {
        attempts++;
        if (window.vapiSDK) {
          clearInterval(check);
          callback();
        } else if (attempts > 50) {
          clearInterval(check);
          console.error('Vapi SDK failed to load');
        }
      }, 200);
    }
  }

  var ASSISTANT_CONFIG = {
    name: CLINIC_NAME + ' Receptionist',
    firstMessage: 'Hi, thanks for calling ' + CLINIC_NAME + '. This is our automated assistant. How can I help you today?',
    voice: { provider: 'openai', voiceId: 'alloy' },
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        }
      ],
      tools: TOOL_DEFINITIONS
    }
  };

  function initVapi() {
    vapiInstance = window.vapiSDK.run({
      apiKey: VAPI_PUBLIC_KEY,
      assistant: ASSISTANT_CONFIG,
      config: {
        position: 'bottom-right',
        offset: '40px',
        width: '0px',
        height: '0px',
        idle: { color: 'transparent', type: 'pill', title: '', subtitle: '' },
        loading: { color: 'transparent', type: 'pill', title: '', subtitle: '' },
        active: { color: 'transparent', type: 'pill', title: '', subtitle: '' }
      }
    });

    bindVapiEvents();
  }

  /* ── Vapi Event Handlers ───────────────────────────── */
  function bindVapiEvents() {
    if (!vapiInstance) return;

    vapiInstance.on('call-start', function () {
      setCallState(CallState.ACTIVE);
      startTimer();
    });

    vapiInstance.on('call-end', function () {
      setCallState(CallState.ENDED);
      stopTimer();
    });

    vapiInstance.on('message', function (msg) {
      if (!msg) return;

      // Final transcripts → chat bubbles
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        var role = msg.role === 'user' ? 'user' : 'ai';
        addTranscriptBubble(role, msg.transcript);
      }

      // Detect booking tool call → show confirmation
      if (msg.type === 'tool-calls' && msg.toolWithToolCallList) {
        msg.toolWithToolCallList.forEach(function (item) {
          var fn = item.function || (item.toolCall && item.toolCall.function);
          if (!fn) return;

          if (fn.name === 'book_appointment') {
            var args = fn.arguments || {};
            if (typeof args === 'string') {
              try { args = JSON.parse(args); } catch (e) { args = {}; }
            }
            bookingDetected = {
              service: args.service || 'Appointment',
              date: args.date || '',
              time: args.time || '',
              patientName: args.patientName || '',
              patientPhone: args.patientPhone || ''
            };
          }
        });
      }
    });

    vapiInstance.on('error', function (err) {
      console.error('Vapi error:', err);
    });
  }

  /* ── Call State Management ─────────────────────────── */
  function setCallState(state) {
    currentState = state;

    dom.stateIdle.classList.remove('active');
    dom.stateConnecting.classList.remove('active');
    dom.stateActive.classList.remove('active');
    dom.stateEnded.classList.remove('active');

    switch (state) {
      case CallState.IDLE:
        dom.stateIdle.classList.add('active');
        dom.transcriptBadge.textContent = 'Waiting';
        dom.transcriptBadge.className = 'transcript-badge inactive';
        break;

      case CallState.CONNECTING:
        dom.stateConnecting.classList.add('active');
        dom.transcriptBadge.textContent = 'Connecting';
        dom.transcriptBadge.className = 'transcript-badge';
        dom.transcriptBadge.style.background = 'var(--color-warning-light)';
        dom.transcriptBadge.style.color = 'var(--color-warning)';
        clearTranscript();
        break;

      case CallState.ACTIVE:
        dom.stateActive.classList.add('active');
        dom.transcriptBadge.textContent = 'Live';
        dom.transcriptBadge.className = 'transcript-badge';
        dom.transcriptBadge.style.background = '';
        dom.transcriptBadge.style.color = '';
        break;

      case CallState.ENDED:
        dom.stateEnded.classList.add('active');
        dom.transcriptBadge.textContent = 'Ended';
        dom.transcriptBadge.className = 'transcript-badge inactive';
        dom.transcriptBadge.style.background = '';
        dom.transcriptBadge.style.color = '';

        if (callStartTime) {
          var elapsed = Math.round((Date.now() - callStartTime) / 1000);
          dom.callDurationSummary.textContent = 'Duration: ' + formatTime(elapsed);
        }

        if (bookingDetected) {
          showConfirmation(bookingDetected);
          bookingDetected = null;
        }
        break;
    }
  }

  /* ── Timer ─────────────────────────────────────────── */
  function startTimer() {
    callStartTime = Date.now();
    dom.callTimer.textContent = '0:00';
    callTimerInterval = setInterval(function () {
      var elapsed = Math.round((Date.now() - callStartTime) / 1000);
      dom.callTimer.textContent = formatTime(elapsed);
    }, 1000);
  }

  function stopTimer() {
    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      callTimerInterval = null;
    }
  }

  function formatTime(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }

  /* ── Transcript ────────────────────────────────────── */
  function clearTranscript() {
    dom.transcriptBody.innerHTML = '';
    dom.confirmationCard.classList.add('hidden');
  }

  function addTranscriptBubble(role, text) {
    if (dom.transcriptEmpty) {
      dom.transcriptEmpty.remove();
    }

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai');

    var label = document.createElement('div');
    label.className = 'chat-bubble-label';
    label.textContent = role === 'user' ? 'You' : 'Receptionist';

    var content = document.createElement('div');
    content.textContent = text;

    bubble.appendChild(label);
    bubble.appendChild(content);
    dom.transcriptBody.appendChild(bubble);

    // Auto-scroll
    dom.transcriptBody.scrollTop = dom.transcriptBody.scrollHeight;
  }

  /* ── Booking Confirmation ──────────────────────────── */
  function showConfirmation(details) {
    var rows = [
      { label: 'Service', value: capitalizeFirst(details.service) },
      { label: 'Date', value: details.date },
      { label: 'Time', value: details.time },
      { label: 'Patient', value: details.patientName },
      { label: 'Phone', value: details.patientPhone }
    ];

    var html = '';
    rows.forEach(function (row) {
      if (row.value) {
        html += '<div class="confirmation-row">' +
          '<span class="confirmation-label">' + row.label + '</span>' +
          '<span class="confirmation-value">' + escapeHtml(row.value) + '</span>' +
          '</div>';
      }
    });

    dom.confirmationDetails.innerHTML = html;
    dom.confirmationCard.classList.remove('hidden');
  }

  /* ── Navigation ────────────────────────────────────── */
  function switchView(viewName) {
    dom.viewReceptionist.classList.remove('active');
    dom.viewDashboard.classList.remove('active');
    dom.navReceptionist.classList.remove('active');
    dom.navDashboard.classList.remove('active');

    if (viewName === 'dashboard') {
      dom.viewDashboard.classList.add('active');
      dom.navDashboard.classList.add('active');
      loadDashboardData();
    } else {
      dom.viewReceptionist.classList.add('active');
      dom.navReceptionist.classList.add('active');
    }
  }

  /* ── Dashboard ─────────────────────────────────────── */
  function loadDashboardData() {
    loadStats();
    loadAppointments();
    loadLeads();
  }

  function loadStats() {
    fetch('/api/stats')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        dom.statCalls.textContent = data.totalCalls || 0;
        dom.statAppointments.textContent = data.totalAppointments || 0;
        dom.statLeads.textContent = data.totalLeads || 0;
      })
      .catch(function () {
        dom.statCalls.textContent = '—';
        dom.statAppointments.textContent = '—';
        dom.statLeads.textContent = '—';
      });
  }

  function loadAppointments() {
    fetch('/api/appointments')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = data.appointments || [];
        if (items.length === 0) {
          dom.appointmentsBody.innerHTML = '<div class="data-empty">No appointments booked yet.</div>';
          return;
        }

        var html = '<table class="data-table">' +
          '<thead><tr>' +
          '<th>Patient</th><th>Service</th><th>Date</th><th>Time</th><th>Phone</th>' +
          '</tr></thead><tbody>';

        items.forEach(function (appt) {
          html += '<tr>' +
            '<td>' + escapeHtml(appt.patientName) + '</td>' +
            '<td>' + escapeHtml(capitalizeFirst(appt.service)) + '</td>' +
            '<td>' + escapeHtml(appt.date) + '</td>' +
            '<td>' + escapeHtml(appt.time) + '</td>' +
            '<td>' + escapeHtml(appt.patientPhone) + '</td>' +
            '</tr>';
        });

        html += '</tbody></table>';
        dom.appointmentsBody.innerHTML = html;
      })
      .catch(function () {
        dom.appointmentsBody.innerHTML = '<div class="data-empty">Unable to load appointments.</div>';
      });
  }

  function loadLeads() {
    fetch('/api/leads')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = data.leads || [];
        if (items.length === 0) {
          dom.leadsBody.innerHTML = '<div class="data-empty">No follow-up leads captured yet.</div>';
          return;
        }

        var html = '<table class="data-table">' +
          '<thead><tr>' +
          '<th>Name</th><th>Phone</th><th>Reason</th><th>Captured</th>' +
          '</tr></thead><tbody>';

        items.forEach(function (lead) {
          html += '<tr>' +
            '<td>' + escapeHtml(lead.name) + '</td>' +
            '<td>' + escapeHtml(lead.phone) + '</td>' +
            '<td>' + escapeHtml(lead.reason) + '</td>' +
            '<td>' + escapeHtml(formatDate(lead.capturedAt)) + '</td>' +
            '</tr>';
        });

        html += '</tbody></table>';
        dom.leadsBody.innerHTML = html;
      })
      .catch(function () {
        dom.leadsBody.innerHTML = '<div class="data-empty">Unable to load leads.</div>';
      });
  }

  /* ── Utilities ─────────────────────────────────────── */
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      var d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return isoStr;
    }
  }

  /* ── Event Binding ─────────────────────────────────── */
  function bindEvents() {
    dom.btnStartCall.addEventListener('click', function () {
      if (currentState !== CallState.IDLE) return;
      setCallState(CallState.CONNECTING);

      waitForVapi(function () {
        if (!vapiInstance) {
          initVapi();
        }
        // Explicitly start the call programmatically since our custom button is driving the UI
        vapiInstance.start(ASSISTANT_CONFIG);
      });
    });

    dom.btnEndCall.addEventListener('click', function () {
      if (vapiInstance && currentState === CallState.ACTIVE) {
        vapiInstance.stop();
      }
    });

    dom.btnNewCall.addEventListener('click', function () {
      setCallState(CallState.IDLE);
      bookingDetected = null;
    });

    // Navigation
    dom.navReceptionist.addEventListener('click', function (e) {
      e.preventDefault();
      switchView('receptionist');
    });

    dom.navDashboard.addEventListener('click', function (e) {
      e.preventDefault();
      switchView('dashboard');
    });

    // Dashboard refresh buttons
    dom.btnRefreshAppointments.addEventListener('click', function () {
      loadAppointments();
    });

    dom.btnRefreshLeads.addEventListener('click', function () {
      loadLeads();
    });
  }

  /* ── Boot ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    bindEvents();
    setCallState(CallState.IDLE);
  });

})();
