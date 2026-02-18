/* ─── COUNTDOWN TIMER ─── */
function initCountdown() {
  const eventDate = new Date('March 6, 2026 00:00:00').getTime();

  function update() {
    const now = new Date().getTime();
    const distance = eventDate - now;

    if (distance < 0) {
      document.getElementById('days').textContent = '00';
      document.getElementById('hours').textContent = '00';
      document.getElementById('minutes').textContent = '00';
      document.getElementById('seconds').textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

/* ─── NAVBAR SCROLL EFFECT ─── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }
}

/* ─── 3D CARD TILT EFFECT ─── */
function initTiltCards() {
  const cards = document.querySelectorAll('[data-tilt]');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });
}

/* ─── SCROLL ANIMATIONS ─── */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

/* ─── ACTIVE NAV LINK HIGHLIGHTING ─── */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 200;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  });
}

/* ─── REGISTER PAGE: PRE-SELECT EVENT ─── */
function initEventPreSelect() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventParam = urlParams.get('event');
  const eventSelect = document.getElementById('eventSelect');

  if (eventParam && eventSelect) {
    const decodedEvent = decodeURIComponent(eventParam);
    for (let i = 0; i < eventSelect.options.length; i++) {
      if (eventSelect.options[i].value === decodedEvent) {
        eventSelect.selectedIndex = i;
        break;
      }
    }
  }
}

/* ─── FORM VALIDATION ─── */
function initFormValidation() {
  const regForm = document.getElementById('registerForm');
  const successModal = document.getElementById('successModal');
  const closeSuccessModalBtn = document.getElementById('closeSuccessModal');
  const successDoneBtn = document.getElementById('successDoneBtn');
  const successEventName = document.getElementById('successEventName');

  function closeSuccessModal() {
    if (!successModal) return;
    successModal.classList.remove('active');
    successModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function openSuccessModal(selectedEventName) {
    if (!successModal) return;
    if (successEventName) {
      successEventName.textContent = selectedEventName || 'your selected event';
    }
    successModal.classList.add('active');
    successModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  if (successModal) {
    if (closeSuccessModalBtn) {
      closeSuccessModalBtn.addEventListener('click', closeSuccessModal);
    }
    if (successDoneBtn) {
      successDoneBtn.addEventListener('click', closeSuccessModal);
    }
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        closeSuccessModal();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && successModal.classList.contains('active')) {
        closeSuccessModal();
      }
    });
  }

  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const inputs = regForm.querySelectorAll('[required]');
      let valid = true;

      inputs.forEach(input => {
        if (!input.value.trim()) {
          valid = false;
          input.style.borderColor = '#ff4444';
          setTimeout(() => { input.style.borderColor = ''; }, 2000);
        }
      });

      if (valid) {
        const btn = regForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        const eventSelect = document.getElementById('eventSelect');
        const selectedEventName = eventSelect ? eventSelect.value : '';
        btn.innerHTML = '<i class="fas fa-check"></i> Registration Submitted!';
        btn.style.background = 'linear-gradient(135deg, #4caf50, #66bb6a)';
        btn.disabled = true;
        openSuccessModal(selectedEventName);

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.disabled = false;
          regForm.reset();
          initEventPreSelect();
        }, 500);
      }
    });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
      btn.style.background = 'linear-gradient(135deg, #4caf50, #66bb6a)';
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.disabled = false;
        contactForm.reset();
      }, 3000);
    });
  }
}

/* ─── PARTICLES BACKGROUND ─── */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const particles = [];
  const count = 80;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      baseRadius: Math.random() * 2 + 0.5,
      radius: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.4 + 0.1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      golden: Math.random() > 0.3
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.pulse += p.pulseSpeed;
      p.radius = p.baseRadius + Math.sin(p.pulse) * 0.5;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const mouseDist = Math.sqrt(dx * dx + dy * dy);
      const mouseGlow = mouseDist < 200 ? (1 - mouseDist / 200) * 0.5 : 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

      if (p.golden) {
        ctx.fillStyle = `rgba(201, 168, 76, ${p.opacity + mouseGlow})`;
        if (mouseGlow > 0.1) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(201, 168, 76, 0.3)';
        }
      } else {
        ctx.fillStyle = `rgba(232, 212, 139, ${p.opacity * 0.7 + mouseGlow})`;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    particles.forEach((a, i) => {
      particles.slice(i + 1).forEach(b => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(201, 168, 76, ${0.06 * (1 - dist / 140)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      });
    });

    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

/* ─── 3D CAROUSEL ─── */
function initCarousel() {
  const stage = document.getElementById('carousel3dStage');
  if (!stage) return;

  const cards = stage.querySelectorAll('.carousel-3d-card');
  const prevBtn = document.querySelector('.carousel-3d-prev');
  const nextBtn = document.querySelector('.carousel-3d-next');
  const totalCards = cards.length;
  let currentIndex = 0;
  let autoPlayTimer;

  function updatePositions() {
    cards.forEach((card) => {
      card.classList.remove('active', 'prev-1', 'prev-2', 'next-1', 'next-2');
    });

    cards[currentIndex].classList.add('active');

    const prev1 = (currentIndex - 1 + totalCards) % totalCards;
    const prev2 = (currentIndex - 2 + totalCards) % totalCards;
    const next1 = (currentIndex + 1) % totalCards;
    const next2 = (currentIndex + 2) % totalCards;

    cards[prev1].classList.add('prev-1');
    cards[prev2].classList.add('prev-2');
    cards[next1].classList.add('next-1');
    cards[next2].classList.add('next-2');
  }

  function goTo(index) {
    currentIndex = ((index % totalCards) + totalCards) % totalCards;
    updatePositions();
    resetAutoPlay();
  }

  function next() {
    goTo(currentIndex + 1);
  }

  function prev() {
    goTo(currentIndex - 1);
  }

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  cards.forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (i !== currentIndex) {
        e.preventDefault();
        goTo(i);
      }
    });
  });

  let touchStartX = 0;
  stage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  }, { passive: true });

  function resetAutoPlay() {
    clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(next, 4000);
  }

  updatePositions();
  resetAutoPlay();
}

/* ─── LOADING SCREEN ─── */
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 1000); // Minimum 1.5s display time for branding
  });
}

/* ─── UPI PAYMENT SYSTEM ─── */
function initPaymentSystem() {
  const eventSelect = document.getElementById('eventSelect');
  const nameInput = document.getElementById('fullName');
  const paymentSection = document.getElementById('paymentSection');
  const payAmountSpan = document.getElementById('payAmount');
  const qrCodeImg = document.getElementById('qrCodeImg');
  const payBtn = document.getElementById('payBtn');
  const txnNoteSpan = document.getElementById('txnNote');
  const transactionIdInput = document.getElementById('transactionId');

  if (!eventSelect || !paymentSection) return;

  function updatePayment() {
    const selectedOption = eventSelect.options[eventSelect.selectedIndex];
    const price = selectedOption.getAttribute('data-price');
    const name = nameInput.value.trim() || 'Participant';
    const eventName = selectedOption.value;

    if (price && eventName) {
      paymentSection.classList.remove('hidden');
      payAmountSpan.textContent = price;

      // Make transaction ID required when payment section is visible
      if (transactionIdInput) transactionIdInput.setAttribute('required', 'true');

      // Create UPI Note: EventName_PersonName
      // Replace spaces with underscores for cleaner UPI format
      const safeEventName = eventName.replace(/\s+/g, '_');
      const safeName = name.replace(/\s+/g, '_');
      const note = `${safeEventName}_${safeName}`;
      txnNoteSpan.textContent = note;

      // Construct UPI URL
      // pa=VPA, pn=PayeeName, am=Amount, tn=Note, cu=Currency
      const vpa = 'thahir05ae-2@okaxis';
      const payee = 'Colloquium 2026';
      const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(payee)}&am=${price}&tn=${encodeURIComponent(note)}&cu=INR`;

      // Update Button Link
      payBtn.href = upiUrl;

      // Generate QR Code
      const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
      qrCodeImg.src = qrApi;
    } else {
      paymentSection.classList.add('hidden');
      // Remove required attribute when hidden
      if (transactionIdInput) transactionIdInput.removeAttribute('required');
    }
  }

  eventSelect.addEventListener('change', updatePayment);
  nameInput.addEventListener('input', updatePayment);

  // Initial check (in case of pre-selection or refresh)
  // Slight delay to ensure pre-select logic runs first
  setTimeout(updatePayment, 100);

  // Reset form handler
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    regForm.addEventListener('reset', () => {
      setTimeout(() => {
        paymentSection.classList.add('hidden');
        if (transactionIdInput) {
          transactionIdInput.value = '';
          transactionIdInput.removeAttribute('required');
        }
      }, 10);
    });
  }

  // Transaction ID Validation (12 digits only)
  if (transactionIdInput) {
    transactionIdInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
    });
  }

  // Mobile QR Toggle Logic
  const showQrBtn = document.getElementById('showQrBtn');
  const qrContainer = document.getElementById('qrCodeContainer');

  if (showQrBtn && qrContainer) {
    showQrBtn.addEventListener('click', () => {
      qrContainer.classList.toggle('visible');
      const isVisible = qrContainer.classList.contains('visible');

      if (isVisible) {
        showQrBtn.innerHTML = 'Hide QR Code <i class="fas fa-eye-slash"></i>';
        // Scroll to QR
        qrContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        showQrBtn.innerHTML = 'Show QR Code <i class="fas fa-qrcode"></i>';
      }
    });
  }
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initCountdown();
  initNavbar();
  initTiltCards();
  initScrollAnimations();
  initActiveNav();
  initEventPreSelect();
  initFormValidation();
  initParticles();
  initCarousel();
  initPaymentSystem();
});


