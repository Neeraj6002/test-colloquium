// ============================================================
// reg.js — Colloquium 2026 Registration Page
// Firebase Firestore Integration + IEEE Membership Logic
// ============================================================

import { db, collection, addDoc, serverTimestamp } from './firebase-config.js';

// ─── CONSTANTS ───────────────────────────────────────────────
const UPI_ID        = "9207796593@paytm"; // ← Replace with your actual UPI ID
const MERCHANT_NAME = "Colloquium 2026";

let submitted = false; // Prevent duplicate submissions

// ============================================================
// PAGE LOADER
// ============================================================
(function initPageLoader() {
    function hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
    }

    if (document.readyState === 'complete') {
        setTimeout(hideLoader, 500);
    } else {
        window.addEventListener('load', () => setTimeout(hideLoader, 1500));
    }

    // Hard fallback after 5s
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader && !loader.classList.contains('hidden')) hideLoader();
    }, 5000);
})();

// ============================================================
// DOM-READY SETUP
// ============================================================
window.addEventListener('DOMContentLoaded', () => {

    // ── Phone: numbers only, max 10 digits ──────────────────
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 10) v = v.slice(0, 10);
            e.target.value = v;
        });
        phoneInput.addEventListener('keypress', e => {
            if (!/[0-9]/.test(String.fromCharCode(e.which))) e.preventDefault();
        });
    }

    const eventField = document.getElementById('eventField');

    // ── Pre-fill event from URL query param ?event=... ───────
    // This is the primary mechanism used by events.html "Register Now" buttons.
    // The ?event= value must exactly match the <option value="..."> attribute.
    const urlParams = new URLSearchParams(window.location.search);
    const urlEvent  = urlParams.get('event');

    if (urlEvent && eventField) {
        // Decode the URL parameter (e.g. "Offenso%20Cyber%20Security%20Workshop" → "Offenso Cyber Security Workshop")
        const decodedEvent = decodeURIComponent(urlEvent);

        // Find the matching option by exact value match
        const matchedOption = [...eventField.options].find(o => o.value === decodedEvent);

        if (matchedOption) {
            eventField.value = decodedEvent;
            handleEventChange(); // trigger price display + payment UI
        }
    }

    // ── Pre-fill event from sessionStorage (set by events page) ──
    // Only use sessionStorage if URL param didn't already set a value
    if (!urlEvent) {
        const savedEvent = sessionStorage.getItem('selectedEvent');
        if (savedEvent && eventField) {
            const matchedOption = [...eventField.options].find(o => o.value === savedEvent);
            if (matchedOption) {
                eventField.value = savedEvent;
                handleEventChange();
            }
        }
    }

    // ── Event listeners ─────────────────────────────────────
    if (eventField) {
        eventField.addEventListener('change', handleEventChange);
    }

    const fullName = document.getElementById('fullName');
    if (fullName) {
        fullName.addEventListener('input', updatePaymentLink);
    }

    // IEEE radio buttons (delegated)
    document.addEventListener('change', e => {
        if (e.target.name === 'ieeeMemberType') handleIeeeMemberToggle();
    });

    detectDeviceAndShowPayment();

    // ── Form submit ─────────────────────────────────────────
    const form = document.getElementById('registrationForm');
    if (form) form.addEventListener('submit', handleFormSubmit);
});

// ============================================================
// HANDLE EVENT SELECTION
// ============================================================
function handleEventChange() {
    const eventField      = document.getElementById('eventField');
    const paymentSection  = document.getElementById('paymentSection');
    const payAmountEl     = document.getElementById('payAmount');
    const ieeeSection     = document.getElementById('ieeeStatusSection');
    const ieeeMemberIdGrp = document.getElementById('ieeeMemberIdGroup');

    if (!eventField || !paymentSection) return;

    const selectedOpt = eventField.options[eventField.selectedIndex];
    const category    = selectedOpt.getAttribute('data-category');
    const isIEEE      = category === 'IEEE';

    // Show/hide IEEE membership section
    if (ieeeSection) {
        ieeeSection.classList.toggle('is-hidden', !isIEEE);
    }

    // Always hide member-ID field when event changes; shown by radio toggle
    if (ieeeMemberIdGrp) {
        ieeeMemberIdGrp.classList.add('is-hidden');
    }

    // Reset IEEE radios to non-member on event change
    const nonMemberRadio = document.querySelector('input[name="ieeeMemberType"][value="non-member"]');
    if (nonMemberRadio) nonMemberRadio.checked = true;

    // Determine price (default to non-member for IEEE events)
    const price = getEffectivePrice(selectedOpt, false);

    if (price !== null) {
        paymentSection.classList.remove('hidden');
        if (payAmountEl) payAmountEl.textContent = price;
        updatePaymentLink();
    } else {
        paymentSection.classList.add('hidden');
    }
}

// ============================================================
// GET EFFECTIVE PRICE (handles IEEE member/non-member split)
// ============================================================
function getEffectivePrice(option, isMember) {
    if (!option || !option.value) return null;

    const category = option.getAttribute('data-category');

    if (category === 'IEEE') {
        const memberPrice    = option.getAttribute('data-member-price');
        const nonMemberPrice = option.getAttribute('data-non-member-price');
        return isMember ? memberPrice : nonMemberPrice;
    }

    // For ISTE, IEDC, OPEN — single flat price
    return option.getAttribute('data-price');
}

// ============================================================
// IEEE MEMBER RADIO TOGGLE
// ============================================================
function handleIeeeMemberToggle() {
    const selectedRadio   = document.querySelector('input[name="ieeeMemberType"]:checked');
    const ieeeMemberIdGrp = document.getElementById('ieeeMemberIdGroup');
    const payAmountEl     = document.getElementById('payAmount');
    const eventField      = document.getElementById('eventField');

    if (!selectedRadio || !eventField) return;

    const isMember = selectedRadio.value === 'member';

    // Show/hide membership ID input
    if (ieeeMemberIdGrp) {
        ieeeMemberIdGrp.classList.toggle('is-hidden', !isMember);
    }

    // Update displayed price
    const selectedOpt = eventField.options[eventField.selectedIndex];
    const price       = getEffectivePrice(selectedOpt, isMember);

    if (price && payAmountEl) {
        payAmountEl.textContent = price;
        updatePaymentLink();
    }
}

// ============================================================
// UPDATE UPI PAYMENT LINK & QR CODE
// ============================================================
function updatePaymentLink() {
    const fullNameEl  = document.getElementById('fullName');
    const eventField  = document.getElementById('eventField');
    const payAmountEl = document.getElementById('payAmount');
    const upiLink     = document.getElementById('upiLink');
    const qrCode      = document.getElementById('qrCode');
    const txnNote     = document.getElementById('txnNote');

    if (!eventField || !payAmountEl) return;

    const name   = fullNameEl ? (fullNameEl.value.trim() || 'User') : 'User';
    const event  = eventField.value || 'Event';
    const amount = payAmountEl.textContent.replace('₹', '').trim() || '0';
    const note   = `${event} - ${name}`;

    const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

    // Mobile UPI deep link
    if (upiLink) upiLink.href = upiUrl;

    // Desktop QR code
    if (qrCode) {
        qrCode.src = `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(upiUrl)}&chs=220x220&choe=UTF-8`;
    }

    // Transaction note preview
    if (txnNote) txnNote.textContent = note;
}

window.updatePaymentLink = updatePaymentLink;

// ============================================================
// DETECT DEVICE → SHOW QR (desktop) or UPI BUTTON (mobile)
// ============================================================
function detectDeviceAndShowPayment() {
    const mobileDiv  = document.getElementById('mobile-payment');
    const desktopDiv = document.getElementById('desktop-payment');
    if (!mobileDiv || !desktopDiv) return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    mobileDiv.style.display  = isMobile ? 'block' : 'none';
    desktopDiv.style.display = isMobile ? 'none'  : 'block';
}

window.addEventListener('resize', detectDeviceAndShowPayment);

// ============================================================
// FORM SUBMISSION → FIREBASE FIRESTORE
// ============================================================
async function handleFormSubmit(e) {
    e.preventDefault();

    if (submitted) {
        showError('You have already submitted. Refresh the page to register again.');
        return;
    }

    // ── Gather field values ──────────────────────────────────
    const fullName      = document.getElementById('fullName').value.trim();
    const email         = document.getElementById('email').value.trim();
    const phone         = document.getElementById('phone').value.trim();
    const college       = document.getElementById('college').value.trim();
    const department    = document.getElementById('department').value.trim();
    const year          = document.getElementById('year').value;
    const eventField    = document.getElementById('eventField').value;
    const teamDetails   = document.getElementById('teamDetails').value.trim();
    const transactionId = document.getElementById('transactionId').value.trim();
    const payAmountEl   = document.getElementById('payAmount');
    const payAmount     = payAmountEl ? payAmountEl.textContent.trim() : '0';

    // IEEE-specific fields
    const memberRadio    = document.querySelector('input[name="ieeeMemberType"]:checked');
    const ieeeMembership = memberRadio ? memberRadio.value : 'non-member';
    const ieeeMemberIdEl = document.getElementById('ieeeMemberId');
    const ieeeMemberId   = ieeeMemberIdEl ? ieeeMemberIdEl.value.trim() : '';

    // ── Validation ───────────────────────────────────────────
    if (fullName.length < 3) {
        return showError('Please enter a valid full name (at least 3 characters).');
    }
    if (!email.includes('@') || !email.includes('.')) {
        return showError('Please enter a valid email address.');
    }
    if (!/^\d{10}$/.test(phone)) {
        return showError('Please enter exactly 10 digits for your phone number.');
    }
    if (!college) {
        return showError('Please enter your college / institution name.');
    }
    if (!department) {
        return showError('Please enter your department.');
    }
    if (!year) {
        return showError('Please select your year of study.');
    }
    if (!eventField) {
        return showError('Please select an event to register for.');
    }
    if (transactionId.length < 6) {
        return showError('Please enter a valid UPI Transaction ID (UTR) — at least 6 characters.');
    }

    // Extra: if IEEE member selected, membership ID is required
    const eventSelectEl = document.getElementById('eventField');
    const selectedOpt   = eventSelectEl.options[eventSelectEl.selectedIndex];
    const isIEEEEvent   = selectedOpt.getAttribute('data-category') === 'IEEE';

    if (isIEEEEvent && ieeeMembership === 'member' && ieeeMemberId.length < 3) {
        return showError('Please enter your IEEE Membership ID to avail the member discount.');
    }

    // ── Show loading spinner ─────────────────────────────────
    showLoading();

    // ── Prepare Firestore document ───────────────────────────
    const formData = {
        fullName:        fullName,
        email:           email,
        phone:           phone,
        college:         college,
        department:      department || 'N/A',
        year:            year       || 'N/A',
        event:           eventField,
        eventCategory:   selectedOpt.getAttribute('data-category') || 'OPEN',
        teamDetails:     teamDetails || 'N/A',
        transactionId:   String(transactionId),
        registrationFee: `₹${payAmount}`,
        ieeeMembership:  isIEEEEvent ? ieeeMembership : 'N/A',
        ieeeMemberId:    isIEEEEvent && ieeeMembership === 'member' ? ieeeMemberId : 'N/A',
        timestamp:       serverTimestamp(),
        status:          'pending',
    };

    // ── Write to Firestore ───────────────────────────────────
    try {
        const docRef = await addDoc(collection(db, 'registrations'), formData);
        console.log('Firestore doc created:', docRef.id);

        hideLoading();
        submitted = true;

        // Update success modal with event name
        const successEventName = document.getElementById('successEventName');
        if (successEventName) successEventName.textContent = eventField;

        // Clear sessionStorage
        sessionStorage.removeItem('selectedEvent');
        sessionStorage.removeItem('eventPrice');

        // Reset form UI
        document.getElementById('registrationForm').reset();
        const paymentSection = document.getElementById('paymentSection');
        if (paymentSection) paymentSection.classList.add('hidden');
        document.getElementById('ieeeStatusSection')?.classList.add('is-hidden');
        document.getElementById('ieeeMemberIdGroup')?.classList.add('is-hidden');

        showSuccess();

    } catch (err) {
        console.error('Firestore error:', err);
        hideLoading();
        showError('Registration failed. Please check your connection and try again.\n\nError: ' + err.message);
    }
}

// ============================================================
// MODAL HELPERS
// ============================================================
function showLoading() {
    const el = document.getElementById('loadingSpinner');
    if (el) { el.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}

function hideLoading() {
    const el = document.getElementById('loadingSpinner');
    if (el) { el.style.display = 'none'; document.body.style.overflow = 'auto'; }
}

function showSuccess() {
    const el = document.getElementById('successModal');
    if (el) {
        el.style.display = 'flex';
        el.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
}

window.closeSuccessModal = function () {
    const el = document.getElementById('successModal');
    if (el) {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
    }
    window.location.href = 'events.html';
};

function showError(message) {
    const modal = document.getElementById('errorModal');
    const msgEl = document.getElementById('errorMessage');

    if (modal && msgEl) {
        msgEl.textContent = message;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        alert(message);
    }
}

window.closeErrorModal = function () {
    const el = document.getElementById('errorModal');
    if (el) {
        el.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// ============================================================
// PARTICLE CANVAS ANIMATION
// ============================================================
const canvas = document.getElementById('particleCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x       = Math.random() * canvas.width;
            this.y       = Math.random() * canvas.height;
            this.size    = Math.random() * 2;
            this.speedX  = (Math.random() - 0.5) * 0.5;
            this.speedY  = (Math.random() - 0.5) * 0.5;
            this.color   = Math.random() > 0.8 ? '#C5A059' : '#ffffff';
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width)  this.x = 0;
            else if (this.x < 0)         this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            else if (this.y < 0)         this.y = canvas.height;
        }
        draw() {
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle   = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    let particles = [];

    function initParticles() {
        particles = [];
        const count = Math.floor((canvas.width * canvas.height) / 9000);
        for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
        detectDeviceAndShowPayment();
    });

    initParticles();
    animate();
}