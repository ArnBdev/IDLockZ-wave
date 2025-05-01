'use strict';

// Initialize settings page
function onHomeyReady(Homey) {
    // Cache elements
    const autoLockEnabled = document.getElementById('autolock_enabled');
    const autoLockTime = document.getElementById('autolock_time');
    const awayMode = document.getElementById('away_mode');
    const userCodesTable = document.getElementById('user_codes_body');
    const accessLogTable = document.getElementById('access_log_body');
    const saveButton = document.getElementById('save');
    const addCodeButton = document.getElementById('add_code');
    const clearLogButton = document.getElementById('clear_log');

    // Settings state
    let settings = {};
    let userCodes = [];
    let accessLog = [];

    // Load initial settings
    Homey.get((err, data) => {
        if (err) {
            Homey.alert(err);
            return;
        }

        settings = data || {};
        initializeSettings();
        refreshUserCodes();
        refreshAccessLog();
    });

    // Initialize settings from saved values
    function initializeSettings() {
        autoLockEnabled.checked = settings.autolock_enabled || false;
        autoLockTime.value = settings.autolock_time || 30;
        awayMode.checked = settings.away_mode || false;
        
        // Enable/disable autolock time based on autolock state
        autoLockTime.disabled = !autoLockEnabled.checked;
    }

    // Refresh user codes table
    function refreshUserCodes() {
        userCodesTable.innerHTML = '';
        userCodes = settings.user_codes || [];

        userCodes.forEach((code, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${code.name}</td>
                <td>••••••</td>
                <td>${code.expiry ? new Date(code.expiry).toLocaleString() : 'Never'}</td>
                <td>
                    <button onclick="editCode(${index})">Edit</button>
                    <button onclick="deleteCode(${index})" class="delete">Delete</button>
                </td>
            `;
            userCodesTable.appendChild(row);
        });
    }

    // Refresh access log table
    function refreshAccessLog() {
        accessLogTable.innerHTML = '';
        accessLog = settings.access_log || [];

        accessLog.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(entry.time).toLocaleString()}</td>
                <td>${entry.action}</td>
                <td>${entry.user || 'Unknown'}</td>
            `;
            accessLogTable.appendChild(row);
        });
    }

    // Event Listeners
    autoLockEnabled.addEventListener('change', function() {
        autoLockTime.disabled = !this.checked;
        settings.autolock_enabled = this.checked;
    });

    autoLockTime.addEventListener('change', function() {
        settings.autolock_time = parseInt(this.value, 10);
    });

    awayMode.addEventListener('change', function() {
        settings.away_mode = this.checked;
    });

    addCodeButton.addEventListener('click', function() {
        const name = prompt('Enter user name:');
        if (!name) return;

        const code = prompt('Enter PIN code (4-10 digits):');
        if (!code || !/^\d{4,10}$/.test(code)) {
            Homey.alert('Invalid code format. Must be 4-10 digits.');
            return;
        }

        userCodes.push({
            name: name,
            code: code,
            created: new Date().toISOString()
        });

        settings.user_codes = userCodes;
        refreshUserCodes();
    });

    clearLogButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the access log?')) {
            accessLog = [];
            settings.access_log = accessLog;
            refreshAccessLog();
        }
    });

    // Save all settings
    saveButton.addEventListener('click', function() {
        Homey.set(settings, function(err) {
            if (err) {
                Homey.alert(err);
                return;
            }
            Homey.alert('Settings saved successfully!');
        });
    });

    // Edit user code
    window.editCode = function(index) {
        const code = userCodes[index];
        
        const name = prompt('Edit user name:', code.name);
        if (!name) return;

        const newCode = prompt('Enter new PIN code (4-10 digits) or leave empty to keep current:');
        if (newCode && !/^\d{4,10}$/.test(newCode)) {
            Homey.alert('Invalid code format. Must be 4-10 digits.');
            return;
        }

        const expiry = prompt('Enter expiry date (YYYY-MM-DD) or leave empty for no expiry:');
        if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
            Homey.alert('Invalid date format. Use YYYY-MM-DD.');
            return;
        }

        userCodes[index] = {
            ...code,
            name: name,
            code: newCode || code.code,
            expiry: expiry ? new Date(expiry).toISOString() : code.expiry,
            modified: new Date().toISOString()
        };

        settings.user_codes = userCodes;
        refreshUserCodes();
    };

    // Delete user code
    window.deleteCode = function(index) {
        if (!confirm(`Are you sure you want to delete the code for ${userCodes[index].name}?`)) {
            return;
        }

        userCodes.splice(index, 1);
        settings.user_codes = userCodes;
        refreshUserCodes();
    };

    // Make settings page visible
    Homey.ready();
}
