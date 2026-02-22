// ============================================================
// ADMIN DASHBOARD WITH FIREBASE INTEGRATION
// ============================================================

import { db, collection, getDocs, doc, updateDoc } from './firebase-config.js';

let allRegistrations = [];
let currentFilter = 'all';
let currentRegistrationId = null;
let isInitialized = false;

// ============================================================
// INITIALIZE DASHBOARD
// ============================================================
export async function initializeDashboard() {
    if (isInitialized) {
        console.log('Dashboard already initialized');
        return;
    }

    console.log('Initializing dashboard...');
    isInitialized = true;

    await loadRegistrations();
    setupEventListeners();
    createBackgroundAnimation();
}

// ============================================================
// SETUP EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', searchTable);
    }

    // Modal close on outside click
    const modal = document.getElementById('detailsModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeDetailsModal();
            }
        });
    }

    // Modal close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeDetailsModal();
        }
    });

    // Window resize for canvas
    window.addEventListener('resize', handleResize);
}

// ============================================================
// LOAD REGISTRATIONS FROM FIREBASE
// ============================================================
async function loadRegistrations() {
    try {
        console.log('Loading registrations from Firestore...');

        const registrationsRef = collection(db, 'registrations');
        const querySnapshot = await getDocs(registrationsRef);

        allRegistrations = [];

        console.log(`Found ${querySnapshot.size} registrations`);

        if (querySnapshot.empty) {
            console.warn('No registrations found in Firestore collection');
            showNoData('No registrations found in database');
            updateStats();
            updateEventCounts();
            return;
        }

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            allRegistrations.push({
                id: docSnapshot.id,
                ...data
            });
        });

        // Sort by timestamp (newest first)
        allRegistrations.sort((a, b) => {
            if (b.timestamp && a.timestamp) {
                return b.timestamp.toMillis() - a.timestamp.toMillis();
            }
            return 0;
        });

        console.log('All registrations loaded:', allRegistrations.length);

        updateStats();
        updateEventCounts();
        displayRegistrations(allRegistrations);

    } catch (error) {
        console.error('Error loading registrations:', error);

        let errorMessage = 'Error loading data.';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please check Firestore security rules.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Firestore is unavailable. Please check your internet connection.';
        } else {
            errorMessage = `Error: ${error.message}`;
        }

        showNoData(errorMessage);
        updateStats();
        updateEventCounts();
    }
}

// ============================================================
// UPDATE STATISTICS
// ============================================================
function updateStats() {
    const total = allRegistrations.length;
    const approved = allRegistrations.filter(r => r.status === 'approved').length;
    const pending = allRegistrations.filter(r => r.status === 'pending' || !r.status).length;

    const totalEl = document.getElementById('totalRegistrations');
    const approvedEl = document.getElementById('approvedCount');
    const pendingEl = document.getElementById('pendingCount');

    if (totalEl) totalEl.textContent = total;
    if (approvedEl) approvedEl.textContent = approved;
    if (pendingEl) pendingEl.textContent = pending;
}

// ============================================================
// UPDATE EVENT COUNTS
// ============================================================
function updateEventCounts() {
    const eventMappings = {
        'Robowar': 'robowar',
        'ACME': 'acme',
        'Bridge Modelling': 'bridge',
        'Automotive Biz Conclave': 'automotive',
        'Reverse Marketing': 'marketing',
        'MUN (ISTE)': 'mun',
        'Debate': 'debate',
        'Prompt Writing': 'prompt',
        'Program Debugging': 'debug',
        'Circuit Designing': 'circuit',
        'AutoCAD Competition': 'autocad',
        'AI Workshop': 'workshop'
    };

    // Update "All Events" count
    const allCountEl = document.getElementById('count-all');
    if (allCountEl) {
        allCountEl.textContent = allRegistrations.length;
    }

    // Update individual event counts
    Object.entries(eventMappings).forEach(([eventName, eventKey]) => {
        const count = allRegistrations.filter(r => r.event === eventName).length;
        const countElement = document.getElementById(`count-${eventKey}`);

        if (countElement) {
            countElement.textContent = count;
        }
    });
}

// ============================================================
// FILTER BY EVENT
// ============================================================
export function filterByEvent(eventName) {
    currentFilter = eventName;

    // Update active button
    document.querySelectorAll('.event-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-event') === eventName) {
            btn.classList.add('active');
        }
    });

    // Filter registrations
    let filtered;
    if (eventName === 'all') {
        filtered = allRegistrations;
        document.getElementById('selectedEventTitle').innerHTML = 'All Registrations';
    } else {
        filtered = allRegistrations.filter(r => r.event === eventName);
        document.getElementById('selectedEventTitle').innerHTML = `${eventName} <span class="gold-accent">Registrations</span>`;
    }

    displayRegistrations(filtered);
}

// ============================================================
// DISPLAY REGISTRATIONS IN TABLE
// ============================================================
function displayRegistrations(registrations) {
    const tableBody = document.getElementById('tableBody');

    if (!tableBody) {
        console.error('Table body element not found!');
        return;
    }

    if (registrations.length === 0) {
        showNoData('No registrations found for this filter');
        return;
    }

    tableBody.innerHTML = '';

    registrations.forEach((reg) => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', reg.id);

        const status = reg.status || 'pending';
        const statusClass = status === 'approved' ? 'status-approved' :
            status === 'rejected' ? 'status-rejected' : 'status-pending';

        const date = reg.timestamp ?
            new Date(reg.timestamp.toMillis()).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }) : 'N/A';

        // Parse department and semester from department field
        // Expected format: "Department - Semester" or just "Department"
        let department = 'N/A';
        let semester = 'N/A';

        if (reg.department) {
            const parts = reg.department.split('-').map(p => p.trim());
            if (parts.length >= 2) {
                department = parts[0];
                semester = parts[1];
            } else {
                department = reg.department;
            }
        }

        // Get year from Firestore (should be a field in the registration document)
        const year = reg.year || 'N/A';

        row.innerHTML = `
            <td>${reg.fullName || 'N/A'}</td>
            <td>${reg.email || 'N/A'}</td>
            <td>${reg.phone || 'N/A'}</td>
            <td>${reg.college || 'N/A'}</td>
            <td>${department}</td>
           
            <td>${year}</td>
            <td>${reg.event || 'N/A'}</td>
              <td>${reg.teamDetails || 'N/A'}</td>
            <td>${reg.ieeeMembership}</td>
          <td>${reg.ieeeMemberId}</td>
            <td>${reg.registrationFee || 'N/A'}</td>
            <td style="font-size: 0.75rem; word-break: break-all;">${reg.upiPaidTo || 'N/A'}</td>
            <td>${reg.paymentDevice || 'N/A'}</td>
            <td>${reg.transactionId || 'N/A'}</td>
            <td>${date}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${status.toUpperCase()}
                </span>
            </td>
            <td>
                <button class="action-btn view-btn" onclick="window.viewDetails('${reg.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                ${status !== 'approved' ? `
                    <button class="action-btn approve-btn" onclick="window.updateStatus('${reg.id}', 'approved')">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                ${status !== 'rejected' ? `
                    <button class="action-btn reject-btn" onclick="window.updateStatus('${reg.id}', 'rejected')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// ============================================================
// SHOW NO DATA MESSAGE
// ============================================================
function showNoData(message) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="16" class="no-data">
                <i class="fas fa-inbox"></i>
                <p>${message}</p>
            </td>
        </tr>
    `;
}

// ============================================================
// VIEW DETAILS MODAL
// ============================================================
export function viewDetails(registrationId) {
    const registration = allRegistrations.find(r => r.id === registrationId);
    if (!registration) {
        console.error('Registration not found:', registrationId);
        return;
    }

    currentRegistrationId = registrationId;

    const date = registration.timestamp ?
        new Date(registration.timestamp.toMillis()).toLocaleString('en-IN') : 'N/A';

    // Parse department and semester for modal display
    let department = 'N/A';
    let semester = 'N/A';

    if (registration.department) {
        const parts = registration.department.split('-').map(p => p.trim());
        if (parts.length >= 2) {
            department = parts[0];
            semester = parts[1];
        } else {
            department = registration.department;
        }
    }

    // Get year from Firestore
    const year = registration.year || 'N/A';

    const detailsContent = document.getElementById('detailsContent');
    detailsContent.innerHTML = `
        <div class="detail-item">
            <label>Full Name</label>
            <p>${registration.fullName || 'N/A'}</p>
        </div>
        <div class="detail-item">
            <label>Email</label>
            <p>${registration.email || 'N/A'}</p>
        </div>
        <div class="detail-item">
            <label>Phone</label>
            <p>${registration.phone || 'N/A'}</p>
        </div>
        <div class="detail-item">
            <label>College</label>
            <p>${registration.college || 'N/A'}</p>
        </div>
        <div class="detail-item">
            <label>Department</label>
            <p>${department}</p>
        </div>
        <div class="detail-item">
            <label>Semester</label>
            <p>${semester}</p>
        </div>
        <div class="detail-item">
            <label>Year</label>
            <p>${year}</p>
        </div>
        <div class="detail-item">
            <label>Event</label>
            <p style="color: var(--gold); font-weight: 600;">${registration.event || 'N/A'}</p>
        </div>
        <div class="detail-item">
            <label>Team Details</label>
            <p>${registration.teamDetails || 'N/A'}</p>
        </div>
        <div class="detail-item">
            <label>Registration Fee</label>
            <p>${registration.registrationFee || 'N/A'}</p>
        </div>
        
        <div class="detail-item">
            <label>UPI Paid To</label>
            <p style="font-size: 0.85rem; word-break: break-all;">${registration.upiPaidTo || 'N/A'}</p>
        </div>
        <div class="detail-item">
            <label>Transaction Note</label>
            <p>${registration.transactionNote || 'N/A'}</p>
        </div>
        <div class="detail-item">
            <label>Payment Device</label>
            <p>${registration.paymentDevice || 'N/A'}</p>
        </div>
        <div class="detail-item">
            <label>Transaction ID</label>
            <p>${registration.transactionId || 'N/A'}</p>
        </div>
        <div class="detail-item">
            <label>Registration Date</label>
            <p>${date}</p>
        </div>
        <div class="detail-item">
            <label>Status</label>
            <p style="color: ${registration.status === 'approved' ? 'var(--green)' :
            registration.status === 'rejected' ? 'var(--red)' : '#ffc107'}">
                ${(registration.status || 'pending').toUpperCase()}
            </p>
        </div>
    `;

    // Update modal buttons
    const approveBtn = document.getElementById('modalApproveBtn');
    const rejectBtn = document.getElementById('modalRejectBtn');

    if (registration.status === 'approved') {
        approveBtn.style.display = 'none';
    } else {
        approveBtn.style.display = 'flex';
    }

    if (registration.status === 'rejected') {
        rejectBtn.style.display = 'none';
    } else {
        rejectBtn.style.display = 'flex';
    }

    // Show modal
    document.getElementById('detailsModal').style.display = 'flex';
}

// ============================================================
// CLOSE DETAILS MODAL
// ============================================================
export function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
    currentRegistrationId = null;
}

// ============================================================
// UPDATE STATUS
// ============================================================
export async function updateStatus(registrationId, newStatus) {
    try {
        console.log(`Updating status for ${registrationId} to ${newStatus}`);

        const docRef = doc(db, 'registrations', registrationId);
        await updateDoc(docRef, {
            status: newStatus
        });

        console.log('Status updated successfully in Firestore');

        // Update local data
        const registration = allRegistrations.find(r => r.id === registrationId);
        if (registration) {
            registration.status = newStatus;
        }

        // Refresh display
        updateStats();
        filterByEvent(currentFilter);

        // Show success message
        alert(`Registration ${newStatus} successfully!`);

    } catch (error) {
        console.error('Error updating status:', error);
        alert(`Error updating status: ${error.message}`);
    }
}

// ============================================================
// APPROVE/REJECT FROM MODAL
// ============================================================
export function approveFromModal() {
    if (currentRegistrationId) {
        updateStatus(currentRegistrationId, 'approved');
        closeDetailsModal();
    }
}

export function rejectFromModal() {
    if (currentRegistrationId) {
        if (confirm('Are you sure you want to reject this registration?')) {
            updateStatus(currentRegistrationId, 'rejected');
            closeDetailsModal();
        }
    }
}

// ============================================================
// SEARCH TABLE
// ============================================================
function searchTable() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    const filtered = allRegistrations.filter(reg => {
        // If a specific event filter is active, maintain it
        if (currentFilter !== 'all' && reg.event !== currentFilter) {
            return false;
        }

        // Search across all fields including year
        return (
            (reg.fullName && reg.fullName.toLowerCase().includes(searchInput)) ||
            (reg.email && reg.email.toLowerCase().includes(searchInput)) ||
            (reg.phone && reg.phone.toLowerCase().includes(searchInput)) ||
            (reg.college && reg.college.toLowerCase().includes(searchInput)) ||
            (reg.department && reg.department.toLowerCase().includes(searchInput)) ||
            (reg.year && reg.year.toString().toLowerCase().includes(searchInput)) ||
            (reg.event && reg.event.toLowerCase().includes(searchInput)) ||
            (reg.transactionId && reg.transactionId.toLowerCase().includes(searchInput))
        );
    });

    displayRegistrations(filtered);
}

// ============================================================
// EXPORT TO CSV
// ============================================================
export function exportToCSV() {
    if (allRegistrations.length === 0) {
        alert('No data to export');
        return;
    }

    // Get filtered registrations based on current view
    let dataToExport;
    if (currentFilter === 'all') {
        dataToExport = allRegistrations;
    } else {
        dataToExport = allRegistrations.filter(r => r.event === currentFilter);
    }

    // CSV Headers - updated to include year
    const headers = ['Name', 'Email', 'Phone', 'College', 'Department', 'Semester', 'Year', 'Event', 'Team Details', 'Fee', 'UPI Paid To', 'Txn Note', 'Payment Device', 'Transaction ID', 'Date', 'Status'];

    // CSV Rows
    const rows = dataToExport.map(reg => {
        const date = reg.timestamp ?
            new Date(reg.timestamp.toMillis()).toLocaleDateString('en-IN') : 'N/A';

        // Parse department and semester
        let department = 'N/A';
        let semester = 'N/A';

        if (reg.department) {
            const parts = reg.department.split('-').map(p => p.trim());
            if (parts.length >= 2) {
                department = parts[0];
                semester = parts[1];
            } else {
                department = reg.department;
            }
        }

        // Get year from Firestore
        const year = reg.year || 'N/A';

        return [
            reg.fullName || 'N/A',
            reg.email || 'N/A',
            reg.phone || 'N/A',
            reg.college || 'N/A',
            department,
            
            year,
            reg.event || 'N/A',
            reg.teamDetails || 'N/A',
            reg.ieeeMembership,
            reg.ieeeMemberId,
            reg.registrationFee || 'N/A',
            reg.upiPaidTo || 'N/A',
            reg.transactionNote || 'N/A',
            reg.paymentDevice || 'N/A',
            reg.transactionId || 'N/A',
            date,
            reg.status || 'pending'
        ].map(field => `"${field}"`).join(',');
    });

    // Combine headers and rows
    const csv = [headers.join(','), ...rows].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `colloquium-2026-${currentFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ============================================================
// REFRESH DATA
// ============================================================
export async function refreshData() {
    const refreshBtn = document.querySelector('.refresh-btn i');
    if (refreshBtn) {
        refreshBtn.classList.add('fa-spin');
    }

    await loadRegistrations();

    setTimeout(() => {
        if (refreshBtn) {
            refreshBtn.classList.remove('fa-spin');
        }
    }, 500);
}

// ============================================================
// BACKGROUND CANVAS ANIMATION
// ============================================================
let particlesArray = [];
let animationFrameId = null;

function createBackgroundAnimation() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2;
            this.speedX = (Math.random() * 0.5) - 0.25;
            this.speedY = (Math.random() * 0.5) - 0.25;
            this.color = Math.random() > 0.8 ? '#C5A059' : '#ffffff';
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > canvas.width) this.x = 0;
            else if (this.x < 0) this.x = canvas.width;

            if (this.y > canvas.height) this.y = 0;
            else if (this.y < 0) this.y = canvas.height;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particlesArray = [];
        let numberOfParticles = (canvas.width * canvas.height) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particlesArray.forEach(particle => {
            particle.update();
            particle.draw();
        });
        animationFrameId = requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();
}

function handleResize() {
    const canvas = document.getElementById('bgCanvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

// ============================================================
// EXPOSE FUNCTIONS TO WINDOW FOR HTML ONCLICK HANDLERS
// ============================================================
window.viewDetails = viewDetails;
window.updateStatus = updateStatus;
window.closeDetailsModal = closeDetailsModal;
window.approveFromModal = approveFromModal;
window.rejectFromModal = rejectFromModal;
window.filterByEvent = filterByEvent;
window.exportToCSV = exportToCSV;
window.refreshData = refreshData;
window.searchTable = searchTable;