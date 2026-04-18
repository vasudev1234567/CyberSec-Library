// Initial data (same as the existing one in script.js to start with)
let adminToolsData = [
    {
        name: "Nmap",
        category: "Networking",
        description: "A free, open-source utility for network discovery and security auditing. It uses raw IP packets to determine what hosts are available on the network, what services they offer, and what operating systems they are running.",
        command: "nmap -sV -sC -p- <target_ip>",
        usage: "This command performs a version scan (-sV) to determine service protocols and application names/versions, runs default Nmap scripts (-sC) for vulnerability detection, and scans all 65535 ports (-p-)."
    },
    {
        name: "Hydra",
        category: "Cracking",
        description: "A very fast network logon cracker which supports many different services. It is used to brute-force combinations of usernames and passwords.",
        command: "hydra -l <username> -P <passwords_list.txt> <target_ip> <service>",
        usage: "Use this to perform a dictionary attack. Replace <username> with the target user, <passwords_list.txt> with your wordlist path, <target_ip> with the target's IP address, and <service> with the protocol (e.g., ssh, ftp)."
    },
    {
        name: "ffuf",
        category: "Web-Scanning",
        description: "A fast web fuzzer written in Go. Used for discovering directories, files, and parameters on web servers.",
        command: "ffuf -w <wordlist_path> -u http://<target_ip>/FUZZ",
        usage: "The 'FUZZ' keyword dictates where the payloads from the wordlist will be injected. Useful for directory brute-forcing."
    },
    {
        name: "SQLmap",
        category: "Web-Scanning",
        description: "An open-source penetration testing tool that automates the process of detecting and exploiting SQL injection flaws and taking over database servers.",
        command: "sqlmap -u \"http://<target_url>?id=1\" --dbs",
        usage: "This command checks the provided URL for SQL injection vulnerabilities and, if vulnerable, attempts to enumerate the databases available on the backend (--dbs)."
    },
    {
        name: "Metasploit",
        category: "Exploitation",
        description: "A widely used penetration testing framework that provides information about security vulnerabilities and aids in penetration testing and IDS signature development.",
        command: "msfconsole",
        usage: "Launches the Metasploit interactive console. From here, you can search for exploits, set payloads, and configure exploit targets."
    },
    {
        name: "Wireshark",
        category: "Networking",
        description: "The world's foremost and widely-used network protocol analyzer. It lets you see what's happening on your network at a microscopic level.",
        command: "wireshark",
        usage: "Launch the GUI application to start capturing and analyzing network traffic across various interfaces."
    },
    {
        name: "John the Ripper",
        category: "Cracking",
        description: "An open source password security auditing and password recovery tool available for many operating systems.",
        command: "john --wordlist=<wordlist.txt> <hashes_file>",
        usage: "Attempts to crack password hashes provided in the <hashes_file> using the dictionary attack mode with the specified wordlist."
    }
];

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("add-tool-form");
    const jsonOutput = document.getElementById("json-output");
    const copyBtn = document.getElementById("copy-btn");

    // Initial render of JSON
    updateJsonDisplay();

    // Form submit event handler
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Retrieve form values
        const newTool = {
            name: document.getElementById("tool-name").value.trim(),
            category: document.getElementById("tool-category").value.trim(),
            description: document.getElementById("tool-description").value.trim(),
            command: document.getElementById("tool-command").value.trim(),
            usage: document.getElementById("tool-usage").value.trim()
        };

        // Add the new tool to the data array
        adminToolsData.push(newTool);

        // Update the JSON display output
        updateJsonDisplay();

        // Reset the form fields
        form.reset();
        
        // Visual feedback on the submit button
        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Added Successfully!";
        submitBtn.style.backgroundColor = "#00cc66";
        submitBtn.style.color = "#fff";
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.backgroundColor = "";
            submitBtn.style.color = "";
        }, 2000);
    });

    // Copy JSON to clipboard event handler
    copyBtn.addEventListener("click", () => {
        const jsonText = `const toolsData = [\n` + 
            adminToolsData.map(tool => {
                return `    {\n        name: "${escapeQuotes(tool.name)}",\n        category: "${escapeQuotes(tool.category)}",\n        description: "${escapeQuotes(tool.description)}",\n        command: "${escapeQuotes(tool.command)}",\n        usage: "${escapeQuotes(tool.usage)}"\n    }`;
            }).join(',\n') + 
        `\n];`;

        navigator.clipboard.writeText(jsonText).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            copyBtn.style.color = "#00ff88";
            copyBtn.style.borderColor = "#00ff88";
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.color = "";
                copyBtn.style.borderColor = "";
            }, 2000);
        });
    });

    // Function to rebuild the JSON text view
    function updateJsonDisplay() {
        jsonOutput.textContent = `const toolsData = [\n` + 
            adminToolsData.map(tool => {
                // Ensure quotes inside descriptions/commands don't break the JS syntax
                return `    {\n        name: "${escapeQuotes(tool.name)}",\n        category: "${escapeQuotes(tool.category)}",\n        description: "${escapeQuotes(tool.description)}",\n        command: "${escapeQuotes(tool.command)}",\n        usage: "${escapeQuotes(tool.usage)}"\n    }`;
            }).join(',\n') + 
        `\n];`;
    }

    // Helper to escape double quotes
    function escapeQuotes(str) {
        return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }
});
