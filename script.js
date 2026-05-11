/**
 * Shared Application Logic: LocalStorage handling, Library Rendering, and Form Submission
 */

// --- IndexedDB Wrapper for Wallpapers ---
const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('CyberSecDB', 1);
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('wallpapers')) {
            db.createObjectStore('wallpapers');
        }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
});

window.saveWallpaperDB = async function(data, type) {
    const db = await dbPromise;
    const tx = db.transaction('wallpapers', 'readwrite');
    tx.objectStore('wallpapers').put({ data, type }, 'customWallpaper');
    return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
};

window.getWallpaperDB = async function() {
    const db = await dbPromise;
    const tx = db.transaction('wallpapers', 'readonly');
    const request = tx.objectStore('wallpapers').get('customWallpaper');
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = reject;
    });
};

window.clearWallpaperDB = async function() {
    const db = await dbPromise;
    const tx = db.transaction('wallpapers', 'readwrite');
    tx.objectStore('wallpapers').delete('customWallpaper');
    return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
};

// --- Theme Management ---
async function applyTheme() {
    const savedTheme = localStorage.getItem('cyberTheme') || 'cyberpunk';
    
    // Check IndexedDB first for large wallpapers
    let wallpaperData = null;
    try {
        wallpaperData = await window.getWallpaperDB();
    } catch (e) {
        console.error("IndexedDB error:", e);
    }
    
    // Fallback to legacy localStorage if DB is empty
    let savedWallpaper = '';
    let dbWallpaperType = '';
    
    if (wallpaperData && wallpaperData.data) {
        savedWallpaper = wallpaperData.data;
        dbWallpaperType = wallpaperData.type;
    } else {
        savedWallpaper = localStorage.getItem('cyberWallpaper');
        dbWallpaperType = localStorage.getItem('cyberWallpaperType');
    }
    
    const root = document.documentElement;
    if (savedTheme === 'cyberpunk') {
        root.style.setProperty('--bg-main', '#0d0d0d');
        root.style.setProperty('--bg-card', 'rgba(17, 17, 17, 0.85)');
        root.style.setProperty('--text-main', '#00ff00');
        root.style.setProperty('--text-muted', '#66cc66');
        root.style.setProperty('--neon-green', '#00ff00');
        root.style.setProperty('--border-color', 'rgba(51, 51, 51, 0.8)');
    } else if (savedTheme === 'matrix') {
        root.style.setProperty('--bg-main', '#000000');
        root.style.setProperty('--bg-card', 'rgba(0, 20, 0, 0.85)');
        root.style.setProperty('--text-main', '#33ff33');
        root.style.setProperty('--text-muted', '#00aa00');
        root.style.setProperty('--neon-green', '#33ff33');
        root.style.setProperty('--border-color', 'rgba(0, 100, 0, 0.8)');
    } else if (savedTheme === 'midnight') {
        root.style.setProperty('--bg-main', '#0b132b');
        root.style.setProperty('--bg-card', 'rgba(28, 37, 65, 0.85)');
        root.style.setProperty('--text-main', '#00ffff');
        root.style.setProperty('--text-muted', '#5bc0be');
        root.style.setProperty('--neon-green', '#00ffff');
        root.style.setProperty('--border-color', 'rgba(58, 80, 107, 0.8)');
    } else if (savedTheme === 'kali') {
        root.style.setProperty('--bg-main', '#050505');
        root.style.setProperty('--bg-card', 'rgba(10, 10, 10, 0.85)');
        root.style.setProperty('--text-main', '#00ff00');
        root.style.setProperty('--text-muted', '#00cc00');
        root.style.setProperty('--neon-green', '#00ff00');
        root.style.setProperty('--border-color', 'rgba(0, 150, 0, 0.6)');
    } else if (savedTheme === 'light') {
        root.style.setProperty('--bg-main', '#f0f4f8');
        root.style.setProperty('--bg-card', 'rgba(255, 255, 255, 0.9)');
        root.style.setProperty('--text-main', '#1a202c');
        root.style.setProperty('--text-muted', '#4a5568');
        root.style.setProperty('--neon-green', '#3182ce');
        root.style.setProperty('--border-color', 'rgba(203, 213, 224, 0.8)');
    }
    
    // Apply background
    function setBackground(wallpaper, theme, wallpaperType) {
        
        // Media Detection logic based on explicit user choice from settings, fallback to extension
        let isVideo = false;
        let isImage = false;
        
        if (wallpaperType === 'live') {
            // GIF needs to be handled as an image fundamentally, but user considers it "live"
            if (wallpaper && (wallpaper.match(/\.gif$/i) || wallpaper.startsWith('data:image/gif'))) {
                isImage = true; 
            } else {
                isVideo = true;
            }
        } else if (wallpaperType === 'image') {
            isImage = true;
        } else {
            // Legacy detection
            isVideo = wallpaper && wallpaper.match(/\.(mp4|webm|ogg)$/i);
            isImage = wallpaper && wallpaper.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        }
        
        // Clean up any existing video elements
        const existingVid = document.getElementById('bg-video');
        if (existingVid) existingVid.remove();
        const existingOverlay = document.getElementById('bg-video-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        // Clean up existing Kali elements
        const existingKali = document.getElementById('kali-bg-container');
        if (existingKali) {
            existingKali.remove();
            if (window.kaliAnimationFrame) {
                cancelAnimationFrame(window.kaliAnimationFrame);
                window.kaliAnimationFrame = null;
            }
            if (window.kaliMouseEnterHandler) {
                document.body.removeEventListener('mouseenter', window.kaliMouseEnterHandler);
                document.body.removeEventListener('mouseleave', window.kaliMouseLeaveHandler);
                window.kaliMouseEnterHandler = null;
                window.kaliMouseLeaveHandler = null;
            }
        }
        
        // Reset default background image style
        document.body.style.backgroundImage = 'none';
        document.body.style.background = '';
        
        if (isVideo) {
            // Add Video Wallpaper
            const video = document.createElement('video');
            video.id = 'bg-video';
            video.src = wallpaper;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.style.position = 'fixed';
            video.style.top = '0';
            video.style.left = '0';
            video.style.width = '100vw';
            video.style.height = '100vh';
            video.style.objectFit = 'cover';
            video.style.zIndex = '-2';
            document.body.appendChild(video);
            
            // Add Dark Overlay for aesthetic consistency
            const overlay = document.createElement('div');
            overlay.id = 'bg-video-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            overlay.style.zIndex = '-1';
            overlay.style.pointerEvents = 'none';
            document.body.appendChild(overlay);
        } else if (wallpaper) {
            // Image Wallpaper (No linear gradient explicitly requested for custom URLs)
            document.body.style.backgroundImage = "url('" + wallpaper + "')";
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        } else if (theme === 'kali' && !wallpaper) {
            // Kali Theme Background
            document.body.style.backgroundColor = '#050505';
            
            const kaliContainer = document.createElement('div');
            kaliContainer.id = 'kali-bg-container';
            kaliContainer.innerHTML = `
                <img id="kali-dragon" src="https://upload.wikimedia.org/wikipedia/commons/2/2b/Kali-dragon-icon.svg" alt="Kali Logo">
                <div id="kali-overlay"></div>
            `;
            document.body.appendChild(kaliContainer);
            
            const dragon = document.getElementById('kali-dragon');
            let isHovering = false;
            let rotY = 0;
            let rotX = 0;
            
            window.kaliMouseEnterHandler = () => {
                if (!isHovering) {
                    isHovering = true;
                    document.body.classList.add('kali-active-hover');
                    function rotate() {
                        if (!isHovering) return;
                        rotY += 1.5;
                        rotX += 0.5;
                        dragon.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
                        window.kaliAnimationFrame = requestAnimationFrame(rotate);
                    }
                    rotate();
                }
            };
            
            window.kaliMouseLeaveHandler = () => {
                isHovering = false;
                document.body.classList.remove('kali-active-hover');
                if (window.kaliAnimationFrame) {
                    cancelAnimationFrame(window.kaliAnimationFrame);
                }
            };
            
            document.body.addEventListener('mouseenter', window.kaliMouseEnterHandler);
            document.body.addEventListener('mouseleave', window.kaliMouseLeaveHandler);
            
        } else {
            // Default Fallbacks
            if (theme === 'light') {
                document.body.style.background = '#f0f4f8';
            } else {
                document.body.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop')";
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundAttachment = 'fixed';
            }
        }
    }

    if (document.body) {
        setBackground(savedWallpaper, savedTheme, dbWallpaperType);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setBackground(savedWallpaper, savedTheme, dbWallpaperType);
        });
    }
}
applyTheme();
// ----------------------------
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
    
    const toolsGrid = document.getElementById('tools-grid');
    if (toolsGrid) {
        const searchBar = document.getElementById('search-bar');
        renderLibrary(searchBar ? searchBar.value : '');
    } else {
        window.location.href = 'index.html';
    }
}

function updateTool(id, name, command) {
    const tools = getTools();
    const idx = tools.findIndex(t => t.id === id);
    if (idx === -1) return;
    tools[idx].name    = name;
    tools[idx].command = command;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
        console.log(`[Storage Update] Updated tool: ${name}`);
    } catch (e) {
        console.error('[Storage Error] Failed to update tool.', e);
        alert('Storage error: Could not save changes.');
    }
}

// --- Edit Modal ---
function openEditModal(id) {
    const tools = getTools();
    const tool = tools.find(t => t.id === id);
    if (!tool) return;
    
    const modal = document.getElementById('edit-modal');
    if (!modal) return;
    
    document.getElementById('edit-tool-id').value      = tool.id;
    document.getElementById('edit-tool-name').value    = tool.name;
    document.getElementById('edit-tool-command').value = tool.command || '';
    
    modal.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;
    modal.classList.remove('modal-open');
    document.body.style.overflow = '';
}

window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;


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
                <h2>&gt; ${tool.name}</h2>
            </div>
            <div class="card-actions">
                <a href="details.html?id=${tool.id}" class="btn-view-details">View Details</a>
                <button class="edit-btn" onclick="openEditModal('${tool.id}')">
                    <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                </button>
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

    let commandHTML = '';
    if (tool.command) {
        const commandLines = tool.command.split('\n').filter(line => line.trim() !== '');
        let commandTableRows = commandLines.map(line => {
            let cmd = line.trim();
            let desc = '';
            
            // Auto split commands by common separators
            const separators = [' | ', ' - ', ' : ', ' // '];
            for (const sep of separators) {
                if (line.includes(sep)) {
                    const parts = line.split(sep);
                    cmd = parts.shift().trim();
                    desc = parts.join(sep).trim();
                    break;
                }
            }
            
            return `
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='rgba(255, 255, 255, 0.05)'" onmouseout="this.style.backgroundColor='transparent'">
                    <td style="padding: 16px 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px;">
                            <code style="color: var(--neon-green); font-family: var(--font-sans); font-weight: bold; white-space: nowrap;">${cmd}</code>
                            <button onclick="copyCommand(this, '${escapeQuotes(cmd)}')" style="background-color: rgba(34, 34, 34, 0.8); color: var(--text-main); border: 1px solid var(--border-color); padding: 4px 8px; border-radius: 4px; cursor: pointer; font-family: var(--font-sans); font-size: 0.8rem; transition: all 0.2s;">Copy</button>
                        </div>
                    </td>
                    <td style="padding: 16px 20px; color: #e2e8f0; font-size: 0.95rem;">
                        ${desc || '<em style="color: rgba(255,255,255,0.3)">No description provided</em>'}
                    </td>
                </tr>
            `;
        }).join('');
        
        commandHTML = `
            <div style="margin-top: 30px;">
                <div class="table-responsive" style="overflow-x: auto; background-color: #0d1117; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">
                    <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                        <thead style="background-color: rgba(0, 0, 0, 0.4); border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                            <tr>
                                <th style="padding: 16px 20px; text-align: left; color: var(--neon-green); font-size: 0.9rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; width: 45%;">Command</th>
                                <th style="padding: 16px 20px; text-align: left; color: var(--neon-green); font-size: 0.9rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Usage / Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${commandTableRows}
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
                </div>
            </div>
            
            ${commandHTML}
            
            <div class="detail-footer">
                <a href="index.html" class="btn-back"><< Back to Library</a>
                <button class="delete-btn" onclick="deleteTool('${tool.id}')">Delete Tool</button>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Splash Screen Logic ---
    const splashScreen = document.getElementById("splash-screen");
    if (splashScreen) {
        if (sessionStorage.getItem('animationPlayed')) {
            // Animation already played in this session, hide immediately
            splashScreen.style.display = 'none';
        } else {
            // First time in this session, mark as played
            sessionStorage.setItem('animationPlayed', 'true');

            // Matrix Rain
            const canvas = document.getElementById("matrix-canvas");
            const ctx = canvas.getContext("2d");
            
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
            const characters = matrix.split("");
            const fontSize = 16;
            const columns = canvas.width / fontSize;
            const drops = [];
            for (let x = 0; x < columns; x++) drops[x] = 1;
            
            function drawMatrix() {
                ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#00FF00";
                ctx.font = fontSize + "px monospace";
                
                for (let i = 0; i < drops.length; i++) {
                    const text = characters[Math.floor(Math.random() * characters.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                    drops[i]++;
                }
            }
            const matrixInterval = setInterval(drawMatrix, 35);
            
            // Resize Canvas on Window Resize
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
            
            // Typewriter Effect
            const textElement = document.getElementById("typewriter-text");
            const textToType = "WELCOME TO CYBERWORLD";
            let typeIndex = 0;
            
            function typeWriter() {
                if (typeIndex < textToType.length) {
                    textElement.innerHTML += textToType.charAt(typeIndex);
                    typeIndex++;
                    setTimeout(typeWriter, 100);
                }
            }
            
            setTimeout(typeWriter, 500); // Start typing after 500ms
            
            // Fade out after exactly 4.5 seconds
            setTimeout(() => {
                clearInterval(matrixInterval);
                splashScreen.style.opacity = '0';
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                }, 800); // Wait for the CSS transition
            }, 4500);
        }
    }
    // --- End Splash Screen Logic ---

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
            const description = ""; // Field removed
            const command = document.getElementById('toolCommand').value.trim();
            const flagDetails = ""; // Field removed
            
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

            if (name && command) {
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
    
    // --- Blue Dragon Dropdown Logic (removed, replaced by sidebar) ---
    // Sidebar open/close toggle
    const sidebarEl    = document.getElementById('cyber-sidebar');
    const openBtn      = document.getElementById('sidebar-open-btn');
    const closeBtn     = document.getElementById('sidebar-close-btn');
    const overlayEl    = document.getElementById('sidebar-overlay');

    function openSidebar() {
        if (sidebarEl)  sidebarEl.classList.add('sidebar-open');
        if (overlayEl)  overlayEl.classList.add('visible');
    }
    function closeSidebar() {
        if (sidebarEl)  sidebarEl.classList.remove('sidebar-open');
        if (overlayEl)  overlayEl.classList.remove('visible');
    }

    if (openBtn)  openBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlayEl) overlayEl.addEventListener('click', closeSidebar);

    // --- Edit Modal Logic ---
    const editModalCloseBtn = document.getElementById('edit-modal-close');
    if (editModalCloseBtn) {
        editModalCloseBtn.addEventListener('click', closeEditModal);
    }

    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        // Close on backdrop click
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeEditModal();
        });
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && editModal.classList.contains('modal-open')) {
                closeEditModal();
            }
        });
    }

    const editToolForm = document.getElementById('edit-tool-form');
    if (editToolForm) {
        editToolForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id      = document.getElementById('edit-tool-id').value;
            const name    = document.getElementById('edit-tool-name').value.trim();
            const command = document.getElementById('edit-tool-command').value.trim();

            if (name && command) {
                updateTool(id, name, command);
                closeEditModal();
                renderLibrary(document.getElementById('search-bar') ? document.getElementById('search-bar').value : '');

                // Flash success feedback on the button
                const submitBtn = editToolForm.querySelector('.btn-save');
                const orig = submitBtn.textContent;
                submitBtn.textContent = 'UPDATED!';
                submitBtn.style.backgroundColor = '#005500';
                submitBtn.style.color = '#fff';
                setTimeout(() => {
                    submitBtn.textContent = orig;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.style.color = '';
                }, 1500);
            }
        });
    }
});
