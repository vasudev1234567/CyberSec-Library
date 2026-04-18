/**
 * Shared Application Logic: LocalStorage handling, Library Rendering, and Form Submission
 */

const STORAGE_KEY = 'cybersec_tools';

const defaultTools = [
    {
        id: "1",
        name: "Nmap",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/19/Nmap_logo.svg",
        description: "Network exploration tool and security / port scanner. Used to discover hosts and services on a computer network.",
        command: "nmap -sV -sC -p- <target_ip>",
        flagDetails: "-sV: Probe open ports to determine service/version info\n-sC: Run default nmap scripts\n-p-: Scan all 65535 ports"
    },
    {
        id: "2",
        name: "FFUF",
        logoUrl: "https://raw.githubusercontent.com/ffuf/ffuf/master/logo.png",
        description: "Fast web fuzzer written in Go. Excellent for directory and parameter fuzzing.",
        command: "ffuf -w <wordlist_path> -u http://<target>/FUZZ",
        flagDetails: "-w: Specify the wordlist path\n-u: Target URL\nFUZZ: The keyword indicating where to inject the payload"
    }
];

function initStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTools));
    }
}

function getTools() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveTool(name, logoUrl, description, command, flagDetails) {
    const tools = getTools();
    const newTool = {
        id: Date.now().toString(),
        name,
        logoUrl, // Note: This will now securely store the long Base64 image string instead of a URL
        description,
        command,
        flagDetails
    };
    tools.push(newTool);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
        console.log(`[Storage Success] Saved tool: ${name}`);
    } catch (e) {
        console.error('[Storage Error] Failed to save tool. Quota may be exceeded.', e);
        alert('Storage error: File might be too large or browser storage is full.');
    }
}

function deleteTool(id) {
    const tools = getTools();
    const updatedTools = tools.filter(tool => tool.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTools));
    
    // Determine where to re-render or redirect
    const toolsGrid = document.getElementById('tools-grid');
    if (toolsGrid) {
        const searchBar = document.getElementById('search-bar');
        renderLibrary(searchBar ? searchBar.value : '');
    } else {
        window.location.href = 'index.html';
    }
}

window.copyCommand = function(btn, commandText) {
    navigator.clipboard.writeText(commandText).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.color = '#00ff00';
        btn.style.borderColor = '#00ff00';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '';
            btn.style.borderColor = '';
        }, 2000);
    });
};

function escapeQuotes(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Render index.html Library Grid
function renderLibrary(searchTerm = '') {
    const toolsGrid = document.getElementById('tools-grid');
    if (!toolsGrid) return;

    let tools = getTools();
    
    if (searchTerm) {
        tools = tools.filter(tool => 
            tool.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    toolsGrid.innerHTML = '';

    if (tools.length === 0) {
        toolsGrid.innerHTML = `<h3 style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px; background-color: var(--bg-card); backdrop-filter: blur(8px); border-radius: 8px;">No tools found matching your criteria.</h3>`;
        return;
    }

    tools.forEach(tool => {
        const card = document.createElement('div');
        card.className = 'tool-card compact-card';
        
        card.innerHTML = `
            <div class="card-header">
                <img src="${tool.logoUrl}" alt="${tool.name} Logo" class="tool-logo-small" onerror="console.warn('[Image] Using fallback for ${tool.name}'); this.outerHTML='<div class=\\'css-placeholder tool-logo-small\\'>No Logo</div>';">
                <h2>> ${tool.name}</h2>
            </div>
            <div class="card-actions">
                <a href="details.html?id=${tool.id}" class="btn-view-details">View Details</a>
                <button class="delete-btn" onclick="deleteTool('${tool.id}')">Delete</button>
            </div>
        `;
        toolsGrid.appendChild(card);
    });
}

// Render details.html Page
function renderDetails() {
    const detailContainer = document.getElementById('detail-container');
    if (!detailContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const toolId = urlParams.get('id');

    const tools = getTools();
    const tool = tools.find(t => t.id === toolId);

    if (!tool) {
        detailContainer.innerHTML = `
            <div class="detail-card" style="text-align: center;">
                <h2 style="color: red; margin-bottom: 20px;">Tool not found!</h2>
                <a href="index.html" class="btn-back"><< Back to Library</a>
            </div>
        `;
        return;
    }

    let explanationHTML = '';
    if (tool.flagDetails) {
        const rows = tool.flagDetails.split('\n').filter(line => line.trim() !== '');
        let tableRows = rows.map(line => {
            const parts = line.split(':');
            if(parts.length >= 2) {
                const flag = parts.shift().trim();
                const desc = parts.join(':').trim();
                return `<tr><td class="flag-col">${flag}</td><td>${desc}</td></tr>`;
            } else {
                return `<tr><td colspan="2">${line.trim()}</td></tr>`;
            }
        }).join('');
        
        explanationHTML = `
            <div class="explanation-box">
                <h4>Flag Details:</h4>
                <div class="table-responsive">
                    <table class="flag-table">
                        <thead>
                            <tr>
                                <th>Flag / Parameter</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    detailContainer.innerHTML = `
        <div class="detail-card">
            <div class="detail-header">
                <img src="${tool.logoUrl}" alt="${tool.name} Logo" class="tool-logo-large" onerror="console.warn('[Image] Using fallback for ${tool.name}'); this.outerHTML='<div class=\\'css-placeholder tool-logo-large\\'>No Logo</div>';">
                <div>
                    <h2>> ${tool.name}</h2>
                    <p class="desc">${tool.description}</p>
                </div>
            </div>
            
            <div class="command-container">
                <button class="copy-btn" onclick="copyCommand(this, '${escapeQuotes(tool.command)}')">Copy</button>
                <div class="command-box">
                    <pre><code>$ ${tool.command}</code></pre>
                </div>
            </div>
            
            ${explanationHTML}
            
            <div class="detail-footer">
                <a href="index.html" class="btn-back"><< Back to Library</a>
                <button class="delete-btn" onclick="deleteTool('${tool.id}')">Delete Tool</button>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    initStorage();

    renderLibrary();
    renderDetails();

    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            renderLibrary(e.target.value);
        });
    }

    const toolForm = document.getElementById('tool-form');
    if (toolForm) {
        toolForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('toolName').value.trim();
            const description = document.getElementById('toolDescription').value.trim();
            const command = document.getElementById('toolCommand').value.trim();
            const flagDetails = document.getElementById('toolFlagDetails').value.trim();
            
            const fileInput = document.getElementById('toolLogoFile');
            const fileError = document.getElementById('file-error');

            if (!fileInput.files || fileInput.files.length === 0) {
                return;
            }

            const file = fileInput.files[0];

            // 100KB Limit Check (100 * 1024 bytes) to prevent localStorage quota issues
            if (file.size > 102400) {
                fileError.style.display = 'block';
                return;
            }
            fileError.style.display = 'none';

            if (name && description && command && flagDetails) {
                console.log(`[Form Submit] Processing tool: ${name}...`);
                
                // Convert file to Base64 using FileReader
                const reader = new FileReader();
                
                reader.onerror = function(error) {
                    console.error('[FileReader Error] Failed to read the file:', error);
                    alert('Error reading the image file.');
                };

                reader.onload = function(event) {
                    console.log('[FileReader Success] Image successfully converted to Base64.');
                    const base64Logo = event.target.result;
                    
                    saveTool(name, base64Logo, description, command, flagDetails);
                    
                    const btn = toolForm.querySelector('.btn-save');
                    const originalText = btn.textContent;
                    btn.textContent = 'SAVED SUCCESSFULLY!';
                    btn.style.backgroundColor = '#005500';
                    btn.style.color = '#fff';
                    
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.backgroundColor = '';
                        btn.style.color = '';
                    }, 2000);

                    toolForm.reset();
                };
                
                // Triggers the onload event once reading is complete
                reader.readAsDataURL(file);
            }
        });
    }
});
