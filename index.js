const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const app = express();

// 📂 BASE DE DATOS
const db = new sqlite3.Database('./servitec_v1.db');

// 📧 MAPA DE CUENTAS GMAIL PARA BÚSQUEDA AUTOMÁTICA
const CUENTAS_GMAIL_MAP = {
    'tokioappoficial@gmail.com': 'avzepljuczbawvoy',
    'riandasnet@gmail.com': 'updchdcdsjnxvnyy',
    'clubecampestrejp@gmail.com': 'ipmvedbivouzeudi',
    'capoeirajpmg@gmail.com': 'vhtvjorujpohphks',
    'darciogarces@gmail.com': 'wkcidkcgtuapcnkh',
    'julianamjp1@gmail.com': 'lkambczcmvkddvcz',
    'casu34jk@gmail.com': 'npbqnwucjkicsnow',
    'santiagorevend@gmail.com': 'dqawfgnliyolqvjy'
};

const MI_CORREO = 'nextra2024@gmail.com';
const MI_CLAVE = 'beqeajbqbrsqobzs'; 
const NUEVA_PASSWORD_FIJA = 'teamo203020';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'servitec_ultra_secure_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT UNIQUE, pass TEXT, rol TEXT, creado_por INTEGER)");
    db.run("CREATE TABLE IF NOT EXISTS correos (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, user_id INTEGER)");
    db.run("ALTER TABLE usuarios ADD COLUMN creado_por INTEGER", (err) => {});
    db.run("INSERT OR IGNORE INTO usuarios (user, pass, rol, creado_por) VALUES ('ecuador', '123456', 'Administrador', NULL)");
});

// 🔥 ESTILOS PROFESIONALES Y MINIMALISTAS - INTERFAZ SERVITEC (ECUADOR) 🔥
const CSS_MODERNO = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :root {
        --bg-deep: #050505;
        --bg-panel: rgba(18, 18, 18, 0.85);
        --bg-sidebar: rgba(10, 10, 10, 0.9);
        --text-primary: #ffffff;
        --text-secondary: #b0b0b0;
        --ec-yellow: #FFD100;
        --ec-yellow-dim: rgba(255, 209, 0, 0.15);
        --ec-blue: #0072CE;
        --ec-blue-dim: rgba(0, 114, 206, 0.15);
        --ec-red: #EF3340;
        --ec-red-dim: rgba(239, 51, 64, 0.15);
        --border-color: rgba(60, 60, 60, 0.3);
    }

    .goog-te-banner-frame.skiptranslate { display: none !important; }
    body { top: 0px !important; }
    #goog-gt-tt { display: none !important; }
    .goog-te-gadget-tooltip { display: none !important; }

    .custom-lang-select { 
        background: rgba(0,0,0,0.8); 
        color: white; 
        border: 1px solid #333; 
        padding: 6px 12px; 
        border-radius: 8px; 
        font-family: 'Inter', sans-serif; 
        font-size: 13px; 
        font-weight: 600; 
        cursor: pointer; 
        outline: none; 
        transition: 0.2s;
    }
    .custom-lang-select:focus, .custom-lang-select:hover { border-color: var(--ec-yellow); }

    body { background: var(--bg-deep); color: var(--text-primary); font-family: 'Inter', sans-serif; margin: 0; padding: 0; box-sizing: border-box; overflow-x: hidden; position: relative; }
    body::after { content: ""; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 15% 15%, rgba(255, 209, 0, 0.05) 0%, transparent 40%), radial-gradient(circle at 85% 85%, rgba(0, 114, 206, 0.05) 0%, transparent 40%); z-index: -1; }

    .top-header { background: rgba(12, 12, 12, 0.7); backdrop-filter: blur(15px); padding: 14px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 25px rgba(0,0,0,0.4); }
    .top-header h2 { margin: 0; font-size: 20px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .top-header .brand-ec { background: linear-gradient(to right, var(--ec-yellow), var(--ec-blue), var(--ec-red)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .top-header .user-badge { background: #1a1a1a; color: var(--text-secondary); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid #333; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .dashboard-layout { display: flex; min-height: calc(100vh - 65px); }
    .sidebar { width: 280px; background: var(--bg-sidebar); backdrop-filter: blur(20px); padding: 30px 20px; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px; position: sticky; top: 65px; height: calc(100vh - 65px); box-sizing: border-box; }
    .sidebar-title { color: #555; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 20px 0 8px 15px; font-weight: 700; }
    
    .main-content { flex: 1; padding: 40px; background: transparent; overflow-y: auto; box-sizing: border-box; }
    
    .tab-btn { background: transparent; color: var(--text-secondary); border: none; padding: 14px 18px; border-radius: 10px; text-align: left; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 14px; width: 100%; box-sizing: border-box; }
    .tab-btn:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-primary); }
    .tab-btn.active { background: #1a1a1a; color: var(--ec-yellow); font-weight: 700; border-left: 3px solid var(--ec-yellow); border-radius: 3px 10px 10px 3px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    
    .sidebar-footer { margin-top: auto; padding-top: 25px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 10px; }
    .tab-panel { display: none; background: var(--bg-panel); backdrop-filter: blur(25px); padding: 45px; border-radius: 20px; border: 1px solid var(--border-color); animation: fadeIn 0.3s ease; max-width: 1000px; margin: 0 auto; box-shadow: 0 15px 50px rgba(0,0,0,0.7); box-sizing: border-box; }
    .tab-panel.active { display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .panel-header { border-bottom: 1px solid var(--border-color); padding-bottom: 25px; margin-bottom: 35px; }
    .panel-header h3 { margin: 0; color: var(--text-primary); font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .panel-header p { margin: 10px 0 0 0; color: var(--text-secondary); font-size: 15px; font-weight: 400; line-height: 1.6; }

    input, select, textarea { width: 100%; padding: 16px 18px; margin-bottom: 18px; border-radius: 10px; border: 1px solid #333; background: rgba(0,0,0,0.4); color: var(--text-primary); box-sizing: border-box; font-size: 15px; font-weight: 500; font-family: 'Inter', sans-serif; transition: 0.2s; }
    input:focus, select:focus, textarea:focus { border-color: var(--ec-yellow); outline: none; background: rgba(0,0,0,0.6); box-shadow: 0 0 12px var(--ec-yellow-dim); }
    
    button.action-btn, .action-btn-link { color: white; border: none; padding: 16px 22px; border-radius: 10px; cursor: pointer; font-weight: 700; width: 100%; box-sizing: border-box; text-transform: uppercase; font-size: 14px; font-family: 'Inter', sans-serif; transition: all 0.2s ease; letter-spacing: 0.8px; display: inline-flex; justify-content: center; align-items: center; text-decoration: none; border: 1px solid transparent; }
    button.action-btn:hover, .action-btn-link:hover { opacity: 0.9; transform: translateY(-1.5px); box-shadow: 0 8px 25px rgba(0,0,0,0.4); }
    
    .btn-yellow-ec { background: linear-gradient(135deg, #FFD100 0%, #CCAA00 100%); color: #000 !important; border-color: #FFD100; box-shadow: 0 6px 20px rgba(255, 209, 0, 0.18); }
    .btn-blue-ec { background: linear-gradient(135deg, #0072CE 0%, #004B87 100%); color: #fff !important; border-color: #0072CE; box-shadow: 0 6px 20px rgba(0, 114, 206, 0.18); }
    .btn-red-ec { background: linear-gradient(135deg, #EF3340 0%, #B30000 100%); color: #fff !important; border-color: #EF3340; box-shadow: 0 6px 20px rgba(239, 51, 64, 0.18); }
    
    .danger-btn-sidebar { background: transparent; border: 1px solid #333; color: #777; padding: 12px 18px; text-align: center; border-radius: 10px; font-size: 12px; text-decoration: none; display: flex; align-items: center; gap: 12px; font-weight: 600; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.8px; width: 100%; box-sizing: border-box; }
    .danger-btn-sidebar:hover { background: rgba(239, 51, 64, 0.08); border-color: var(--ec-red); color: var(--ec-red); }

    .folder { background: #0d0d0d; border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; margin-bottom: 18px; transition: 0.2s; }
    .folder:hover { border-color: #444; box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
    .folder summary { padding: 20px 28px; font-weight: 600; font-size: 16px; color: var(--text-primary); cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
    .folder summary::-webkit-details-marker { display: none; }
    .folder summary .user-count { font-size: 12px; background: #1a1a1a; color: var(--text-secondary); padding: 6px 14px; border-radius: 14px; border: 1px solid #333; font-weight: 500; }
    .folder-content { padding: 28px; background: #111; border-top: 1px solid var(--border-color); }

    .client-card { background: #080808; border: 1px solid var(--border-color); padding: 22px; margin-bottom: 18px; border-radius: 12px; position: relative; border-left: 3.5px solid; transition: 0.2s; }
    .client-card:hover { border-color: #444; box-shadow: 0 6px 18px rgba(0,0,0,0.4); }
    .client-card strong { font-size: 16px; font-weight: 600; letter-spacing: -0.2px; }
    .del-btn { position: absolute; top: 22px; right: 22px; color: #444; text-decoration: none; font-weight: bold; font-size: 18px; transition: 0.2s; }
    .del-btn:hover { color: var(--ec-red); transform: scale(1.15); }
    
    .email-list { max-height: 180px; overflow-y: auto; background: #050505; padding: 12px; border-radius: 8px; margin-top: 18px; font-size: 14px; border: 1px solid #1a1a1a; }
    .email-item { display: flex; justify-content: space-between; border-bottom: 1px solid #111; padding: 10px 8px; color: #b0b0b0; }
    .email-item:last-child { border-bottom: none; }

    /* ESTILOS DEL REGISTRO EN TIEMPO REAL AUTO-RESET */
    #status-console {
        background: #000;
        border: 1px solid #333;
        border-radius: 10px;
        padding: 20px;
        font-family: monospace;
        font-size: 14px;
        color: #00ff66;
        min-height: 220px;
        max-height: 350px;
        overflow-y: auto;
        margin-top: 20px;
        line-height: 1.8;
    }
    .log-step { display: flex; align-items: center; gap: 10px; }
    .log-time { color: #888; font-size: 12px; }
    .log-err { color: #ff4d4d; }
    .log-warn { color: #ffb84d; }
    .log-info { color: #4da6ff; }
</style>

<script>
    function openTab(tabId) {
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        const btn = document.querySelector('[onclick="openTab(\\''+tabId+'\\')"]');
        if (btn) btn.classList.add('active');
        localStorage.setItem('activeServitecTab', tabId);
    }
    document.addEventListener('DOMContentLoaded', () => {
        let active = localStorage.getItem('activeServitecTab') || 'panel-stream';
        openTab(active);
    });
    function buscarCorreoLocal() {
        let input = document.getElementById('buscadorLocal').value.toLowerCase();
        let folders = document.querySelectorAll('.item-folder');
        let clients = document.querySelectorAll('.item-client');

        if(input === '') {
            folders.forEach(f => { f.style.display = ''; f.removeAttribute('open'); });
            clients.forEach(c => c.style.display = '');
            return;
        }
        clients.forEach(c => {
            let text = c.innerText.toLowerCase();
            c.style.display = text.includes(input) ? '' : 'none';
        });
        folders.forEach(f => {
            let text = f.innerText.toLowerCase();
            if(text.includes(input)) { f.style.display = ''; f.setAttribute('open', 'true'); } 
            else { f.style.display = 'none'; f.removeAttribute('open'); }
        });
    }

    function googleTranslateElementInit() {
        new google.translate.TranslateElement({pageLanguage: 'es', includedLanguages: 'es,en,pt', autoDisplay: false}, 'google_translate_element');
    }
    function changeLanguage(lang) {
        var selectField = document.querySelector(".goog-te-combo");
        if (selectField) {
            selectField.value = lang;
            selectField.dispatchEvent(new Event('change'));
        }
    }

    // 🔥 AUTOMATIZACIÓN CLIENTE TIEMPO REAL 🔥
    async function iniciarAutoReset(e) {
        e.preventDefault();
        const emailInput = document.getElementById('email_reset_auto').value.trim();
        const consola = document.getElementById('status-console');
        const btn = document.getElementById('btn-run-reset');
        
        if (!emailInput) return;
        consola.innerHTML = '<div class="log-step"><span class="log-time">['+new Date().toLocaleTimeString()+']</span> <span>🚀 Iniciando proceso automático para: <b>'+emailInput+'</b>...</span></div>';
        btn.disabled = true;
        btn.style.opacity = '0.5';

        try {
            const res = await fetch('/api/automatizar-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput })
            });
            const data = await res.json();
            
            if (data.logs && Array.isArray(data.logs)) {
                consola.innerHTML = '';
                data.logs.forEach(l => {
                    let clase = '';
                    if (l.tipo === 'error') clase = 'log-err';
                    else if (l.tipo === 'alerta') clase = 'log-warn';
                    else if (l.tipo === 'info') clase = 'log-info';
                    consola.innerHTML += '<div class="log-step '+clase+'"><span class="log-time">['+l.hora+']</span> <span>'+l.mensaje+'</span></div>';
                });
            }

            if (data.exito) {
                consola.innerHTML += '<div class="log-step" style="color:#00ff66; font-weight:bold; margin-top:10px;">✅ PROCESO COMPLETADO: Contraseña actualizada a teamo203020</div>';
            } else {
                consola.innerHTML += '<div class="log-step log-err" style="font-weight:bold; margin-top:10px;">❌ ERROR EN EL PROCESO: '+ (data.error || 'Intento fallido') +'</div>';
            }
        } catch (err) {
            consola.innerHTML += '<div class="log-step log-err">❌ Error de comunicación con el servidor de automatización.</div>';
        } finally {
            btn.disabled = false;
            btn.style.opacity = '1';
            consola.scrollTop = consola.scrollHeight;
        }
    }
</script>
<script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
`;

app.use((req, res, next) => {
    const rutasAbiertas = ['/', '/login', '/logout', '/api/automatizar-reset'];
    if (rutasAbiertas.includes(req.path)) return next();
    if (req.session && req.session.uid) {
        db.get("SELECT id FROM usuarios WHERE id = ?", [req.session.uid], (err, row) => {
            if (!row) {
                req.session.destroy();
                return res.send("<script>alert('⛔ ACCESO DENEGADO \\n\\nTu cuenta ha sido eliminada por el administrador.'); window.location='/';</script>");
            }
            next();
        });
    } else { return res.redirect('/'); }
});

// -----------------------------------------------------------
// 🔍 FUNCIÓN PARA LEER CORREOS EN EL MAPA GMAIL AUTOMÁTICAMENTE
// -----------------------------------------------------------
async function buscarEnlaceEnCorreos(emailObjetivo, tipoBusqueda = 'reset') {
    const minTimestamp = Date.now() - (15 * 60 * 1000); // Buscar correos de los últimos 15 min

    for (const [gmailUser, gmailPass] of Object.entries(CUENTAS_GMAIL_MAP)) {
        const config = {
            imap: {
                user: gmailUser,
                password: gmailPass,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false }
            }
        };

        try {
            const connection = await imaps.connect(config);
            await connection.openBox('INBOX');
            
            // Buscar mensajes que contengan el correo objetivo
            const messages = await connection.search([['TEXT', emailObjetivo.trim()]], { bodies: [''], struct: true });
            
            if (messages && messages.length > 0) {
                messages.sort((a, b) => b.attributes.uid - a.attributes.uid);
                
                for (let msg of messages) {
                    const mail = await simpleParser(msg.parts.find(p => p.which === '').body);
                    const timestampMail = new Date(mail.date).getTime();
                    
                    // Solo evaluar correos recientes
                    if (timestampMail < minTimestamp) continue;

                    const html = mail.html || mail.textAsHtml || "";
                    const text = mail.text || "";
                    const $ = cheerio.load(html);

                    if (tipoBusqueda === 'reset') {
                        // Enlace oficial de restablecimiento
                        let link = $('a[href*="netflix.com/password"]').attr('href') || 
                                   $('a:contains("Restablecer"), a:contains("Reset"), a:contains("cambiar"), a:contains("contraseña")').attr('href');
                        if (!link) {
                            const match = text.match(/https?:\/\/[^\s]+netflix\.com\/password[^\s]+/i);
                            if (match) link = match[0];
                        }
                        if (link) {
                            connection.end();
                            return { encontrado: true, link: link, gmail: gmailUser };
                        }
                    } else if (tipoBusqueda === 'seguridad') {
                        // Alerta de seguridad: "Un nuevo dispositivo está usando tu cuenta" -> Enlace "cambies la contraseña"
                        let link = $('a:contains("cambies la contraseña"), a:contains("cambiar la contraseña"), a[href*="netflix.com/password"]').attr('href');
                        if (!link) {
                            const match = text.match(/https?:\/\/[^\s]+netflix\.com\/password[^\s]+/i);
                            if (match) link = match[0];
                        }
                        if (link) {
                            connection.end();
                            return { encontrado: true, link: link, gmail: gmailUser };
                        }
                    }
                }
            }
            connection.end();
        } catch (e) {
            console.error(`Error IMAP en ${gmailUser}:`, e.message);
        }
    }
    return { encontrado: false };
}

// -----------------------------------------------------------
// 🤖 API AUTOMATIZACIÓN PUPPETEER (FLUJO 1 + FALLBACK FLUJO 2)
// -----------------------------------------------------------
app.post('/api/automatizar-reset', async (req, res) => {
    const { email } = req.body;
    const logs = [];
    const addLog = (msg, tipo = 'normal') => {
        logs.push({ hora: new Date().toLocaleTimeString(), mensaje: msg, tipo });
        console.log(`[AUTO-RESET] [${tipo.toUpperCase()}] ${msg}`);
    };

    if (!email) {
        return res.json({ exito: false, error: 'Correo no especificado', logs });
    }

    let browser = null;
    try {
        addLog(`Iniciando navegador headless para ${email}...`, 'info');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/55.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // ==========================================
        // MÉTODO 1: Restablecimiento Tradicional
        // ==========================================
        addLog('Paso 1: Abriendo portal de recuperación de Netflix...', 'info');
        await page.goto('https://www.netflix.com/co/loginhelp', { waitUntil: 'networkidle2', timeout: 30000 });

        await page.waitForSelector('input[name="forgot_password_input"], input[type="email"], input[name="email"]', { timeout: 15000 });
        const inputSelector = await page.$('input[name="forgot_password_input"]') || await page.$('input[type="email"]') || await page.$('input[name="email"]');
        
        await inputSelector.type(email, { delay: 40 });
        addLog('Correo ingresado. Solicitando envío de enlace...', 'normal');

        // Clic en "Enviarme email"
        const submitBtn = await page.$('button[type="submit"], button:has-text("Enviarme email"), input[type="submit"]');
        if (submitBtn) {
            await submitBtn.click();
        } else {
            await page.keyboard.press('Enter');
        }
        await new Promise(r => setTimeout(r, 4000));

        // Detectar si aparece bloqueo de límite ("Inténtalo más tarde")
        const contentBody = await page.content();
        const errorLimite = contentBody.toLowerCase().includes('inténtalo más tarde') || 
                            contentBody.toLowerCase().includes('demasiados intentos') ||
                            contentBody.toLowerCase().includes('try again later');

        if (errorLimite) {
            addLog('⚠️ Detectado mensaje "Inténtalo más tarde". Activando MÉTODO 2 (Alerta de dispositivo)...', 'alerta');
            
            // ==========================================
            // MÉTODO 2: Fallback (Alerta de inicio de sesión)
            // ==========================================
            addLog('Paso 1 (M2): Forzando intento de inicio de sesión para generar correo de seguridad...', 'info');
            await page.goto('https://www.netflix.com/login', { waitUntil: 'networkidle2' });
            
            const loginUser = await page.$('input[name="userLoginId"], input[name="email"]');
            const loginPass = await page.$('input[name="password"]');
            if (loginUser && loginPass) {
                await loginUser.type(email, { delay: 35 });
                await loginPass.type('ClaveTemporalInvalida2026!', { delay: 35 });
                await page.keyboard.press('Enter');
                await new Promise(r => setTimeout(r, 4000));
            }

            addLog('Paso 2 (M2): Esperando correo de alerta "Un nuevo dispositivo está usando tu cuenta"...', 'info');
            let enlaceSeguridad = null;
            for (let intento = 1; intento <= 8; intento++) {
                addLog(`Buscando correo de seguridad en buzones Gmail (Intento ${intento}/8)...`, 'normal');
                const busqueda = await buscarEnlaceEnCorreos(email, 'seguridad');
                if (busqueda.encontrado) {
                    enlaceSeguridad = busqueda.link;
                    addLog(`🔗 Enlace de seguridad encontrado en: ${busqueda.gmail}`, 'info');
                    break;
                }
                await new Promise(r => setTimeout(r, 6000));
            }

            if (!enlaceSeguridad) {
                throw new Error('No se recibió el correo de alerta de seguridad en el tiempo esperado.');
            }

            addLog('Paso 3 (M2): Abriendo enlace de cambio de contraseña...', 'info');
            await page.goto(enlaceSeguridad, { waitUntil: 'networkidle2' });

        } else {
            // Continuación Método 1 (Correo normal recibido)
            addLog('Solicitud aceptada. Esperando correo oficial de restablecimiento...', 'info');
            let enlaceReset = null;
            for (let intento = 1; intento <= 8; intento++) {
                addLog(`Buscando enlace en mapa Gmail (Intento ${intento}/8)...`, 'normal');
                const busqueda = await buscarEnlaceEnCorreos(email, 'reset');
                if (busqueda.encontrado) {
                    enlaceReset = busqueda.link;
                    addLog(`🔗 Enlace oficial detectado en: ${busqueda.gmail}`, 'info');
                    break;
                }
                await new Promise(r => setTimeout(r, 6000));
            }

            if (!enlaceReset) {
                throw new Error('No llegó el correo de restablecimiento tras varios intentos.');
            }

            addLog('Paso 3: Abriendo enlace de cambio automático de contraseña...', 'info');
            await page.goto(enlaceReset, { waitUntil: 'networkidle2' });
        }

        // ==========================================
        // PASO FINAL COMÚN: ESTABLECER CLAVE NUEVA
        // ==========================================
        addLog(`Paso 4: Ingresando nueva contraseña fija (${NUEVA_PASSWORD_FIJA})...`, 'info');
        await page.waitForSelector('input[name="newPassword"], input[type="password"]', { timeout: 15000 });
        
        const inputsPass = await page.$$('input[type="password"]');
        for (let inp of inputsPass) {
            await inp.type(NUEVA_PASSWORD_FIJA, { delay: 45 });
        }

        // Desmarcar o mantener "Cerrar sesión en todos los dispositivos" según el DOM
        const checkCerrarSesion = await page.$('input[type="checkbox"][name="requireAllDevicesSignIn"]');
        if (checkCerrarSesion) {
            addLog('Configurando casillas de seguridad del formulario...', 'normal');
        }

        // Guardar
        const btnGuardar = await page.$('button[type="submit"], button:has-text("Guardar")');
        if (btnGuardar) {
            await btnGuardar.click();
        } else {
            await page.keyboard.press('Enter');
        }

        await new Promise(r => setTimeout(r, 5000));
        addLog('✅ ¡CONTRASEÑA CAMBIADA CON ÉXITO A: teamo203020!', 'info');

        await browser.close();
        return res.json({ exito: true, logs });

    } catch (error) {
        if (browser) await browser.close();
        addLog(`Error en el proceso: ${error.message}`, 'error');
        return res.json({ exito: false, error: error.message, logs });
    }
});

// -----------------------------------------------------------
// 🔥 PANTALLA DE INICIO (Login) CON SELECTOR DE IDIOMA
// -----------------------------------------------------------
app.get('/', (req, res) => {
    const ESTILO_LOGIN = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        :root {
            --bg-deep: #0a0a0a;
            --bg-panel: rgba(18, 18, 18, 0.95); 
            --ec-yellow: #FFD100;
            --ec-blue: #0072CE;
            --ec-red: #EF3340;
        }
        body { color: white; font-family: 'Inter', sans-serif; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; position: relative; background-color: var(--bg-deep); }
        .login-panel { position: relative; background: var(--bg-panel); padding: 70px 50px; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.05); max-width: 440px; width: 90%; text-align: center; box-shadow: 0 25px 70px rgba(0,0,0,0.8); box-sizing: border-box; }
        .logo-ec { font-size: 32px; font-weight: 800; margin-bottom: 12px; text-transform: uppercase; letter-spacing: -1.2px; line-height: 1.1; }
        .logo-ec .yellow { color: var(--ec-yellow); } .logo-ec .blue { color: var(--ec-blue); } .logo-ec .red { color: var(--ec-red); }
        h2 { color: #b0b0b0; margin-bottom: 40px; font-weight: 500; font-size: 15px; margin-top: 0; line-height: 1.5; }
        input { width: 100%; padding: 18px; margin-bottom: 18px; border-radius: 10px; border: 1px solid #333; background: rgba(0,0,0,0.6); color: white; box-sizing: border-box; font-size: 16px; font-weight: 500; transition: 0.2s; }
        input:focus { border-color: var(--ec-yellow); outline: none; background: rgba(0,0,0,0.8); box-shadow: 0 0 12px rgba(255, 209, 0, 0.2); }
        .btn-neon-yellow { background: linear-gradient(135deg, #FFD100 0%, #CCAA00 100%); color: #000; border: none; padding: 18px; border-radius: 10px; cursor: pointer; font-weight: 700; width: 100%; text-transform: uppercase; font-size: 15px; letter-spacing: 0.8px; border: 1px solid var(--ec-yellow); box-shadow: 0 6px 25px rgba(255, 209, 0, 0.25); transition: all 0.2s ease; font-family: 'Inter', sans-serif; }
        .btn-neon-yellow:hover { opacity: 0.9; transform: translateY(-1.5px); box-shadow: 0 8px 30px rgba(255, 209, 0, 0.35); }
        .goog-te-banner-frame.skiptranslate { display: none !important; }
        body { top: 0px !important; }
        #goog-gt-tt { display: none !important; }
        .lang-selector-login { position: absolute; top: 30px; right: 40px; z-index: 1000; }
        .lang-selector-login select { background: rgba(18,18,18,0.9); color: white; border: 1px solid var(--ec-yellow); padding: 10px 15px; border-radius: 10px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; cursor: pointer; outline: none; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transition: 0.2s; }
        .lang-selector-login select:hover { box-shadow: 0 4px 20px rgba(255, 209, 0, 0.2); }
    </style>
    `;
    res.send(`${ESTILO_LOGIN}
    
    <div style="position: absolute; width: 0; height: 0; overflow: hidden; z-index: -1;">
        <div id="google_translate_element"></div>
    </div>
    
    <div class="lang-selector-login">
        <select onchange="changeLanguage(this.value)">
            <option value="es">🇪🇸 Español</option>
            <option value="en">🇺🇸 English</option>
            <option value="pt">🇧🇷 Português</option>
        </select>
    </div>

    <div class="login-panel">
        <div class="logo-ec"><span class="yellow">⚡ SERVI</span><span class="blue">TEC</span> <br><span class="red">E C U A D O R</span></div>
        <h2>Panel de Control Profesional <br>Acceso Seguro</h2>
        <form action="/login" method="POST">
            <input name="user" placeholder="Nombre de Usuario Master" required>
            <input type="password" name="pass" placeholder="Contraseña de Seguridad" required>
            <button class="btn-neon-yellow">🔓 Iniciar Sesión</button>
        </form>
    </div>

    <script type="text/javascript">
        function googleTranslateElementInit() {
            new google.translate.TranslateElement({pageLanguage: 'es', includedLanguages: 'es,en,pt', autoDisplay: false}, 'google_translate_element');
        }
        function changeLanguage(lang) {
            var selectField = document.querySelector(".goog-te-combo");
            if (selectField) {
                selectField.value = lang;
                selectField.dispatchEvent(new Event('change'));
            }
        }
    </script>
    <script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
    </body>`);
});

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    db.get("SELECT * FROM usuarios WHERE user = ? AND pass = ?", [user, pass], (err, row) => {
        if (row) {
            req.session.uid = row.id; req.session.user = row.user; req.session.rol = row.rol;
            res.redirect('/dash');
        } else { res.send("<script>alert('⛔ Datos de acceso incorrectos.'); window.location='/';</script>"); }
    });
});

app.get('/admin/logout-todos', (req, res) => {
    const esAdminPrincipal = (req.session.user === 'ecuador' || req.session.rol === 'Administrador');
    if (esAdminPrincipal) {
        req.sessionStore.clear((err) => { res.send("<script>alert('✅ Se ha cerrado la sesión de TODOS los usuarios conectados.'); window.location='/';</script>"); });
    } else { res.redirect('/dash'); }
});

app.get('/admin/nuke-database', (req, res) => {
    const esAdminPrincipal = (req.session.user === 'ecuador' || req.session.rol === 'Administrador');
    if (esAdminPrincipal) {
        db.run("DELETE FROM correos", [], () => {
            db.run("DELETE FROM usuarios WHERE user != 'ecuador'", [], () => {
                res.send("<script>alert('💥 BASE DE DATOS FORMATEADA COMPLETAMENTE.'); window.location='/dash';</script>");
            });
        });
    } else { res.redirect('/dash'); }
});

app.get('/dash', (req, res) => {
    const esAdminPrincipal = (req.session.user === 'ecuador' || req.session.rol === 'Administrador');
    const esSubAdmin = (req.session.rol === 'Subadministrador');

    if (esAdminPrincipal || esSubAdmin) {
        let query = esAdminPrincipal ? "SELECT * FROM usuarios WHERE user != 'ecuador'" : "SELECT * FROM usuarios WHERE creado_por = ? OR id = ?";
        let params = esAdminPrincipal ? [] : [req.session.uid, req.session.uid];

        db.all(query, params, (err, usuarios) => {
            db.all("SELECT * FROM correos", [], (err, correos) => {
                
                let subadmins = usuarios.filter(u => u.rol === 'Subadministrador');
                let clientes = usuarios.filter(u => u.rol === 'Cliente');
                if (esSubAdmin) subadmins = usuarios.filter(u => u.id === req.session.uid);

                let subadminsHtml = "";
                subadmins.forEach(sub => {
                    let clientesDelSub = clientes.filter(c => c.creado_por === sub.id);
                    subadminsHtml += `
                    <details class="folder item-folder">
                        <summary>
                            <span>📁 ${sub.user.toUpperCase()}</span>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span class="user-count">${clientesDelSub.length} usuarios</span>
                            </div>
                        </summary>
                        <div class="folder-content">
                            <a href="/admin/del-user/${sub.id}" class="action-btn-link btn-red-ec" style="margin-bottom:25px; padding: 10px; font-size:11px;" onclick="return confirm('⚠️ ¿Borrar a este subadmin y sus clientes?')">❌ ELIMINAR SUBADMINISTRADOR</a>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px;">`;
                            clientesDelSub.forEach(cli => {
                                let correosDelCli = correos.filter(c => c.user_id === cli.id);
                                subadminsHtml += `
                                <div class="client-card item-client" style="border-left-color: var(--ec-yellow);">
                                    <strong style="color: var(--ec-yellow);">👤 ${cli.user}</strong>
                                    <a href="/admin/del-user/${cli.id}" class="del-btn" onclick="return confirm('¿Borrar cliente?')">×</a>
                                    <form action="/admin/add-mail-masivo" method="POST" style="margin-top:15px; display:flex; gap:8px;">
                                        <input type="hidden" name="uid" value="${cli.id}">
                                        <input name="emails" placeholder="Pega los correos..." style="padding:10px; margin:0; font-size:13px;">
                                        <button class="action-btn btn-yellow-ec" style="width:auto; padding:10px 15px; font-size:12px;">📥</button>
                                    </form>
                                    <div class="email-list">`;
                                        correosDelCli.forEach(m => { subadminsHtml += `<div class="email-item"><span>${m.email}</span> <a href="/admin/del-mail/${m.id}" style="color:#f00; text-decoration:none;">×</a></div>`; });
                                subadminsHtml += `</div></div>`;
                            });
                    subadminsHtml += `</div></div></details>`;
                });

                let clientesDirectosHtml = "";
                if (esAdminPrincipal) {
                    let clientesDirectos = clientes.filter(c => !c.creado_por);
                    if(clientesDirectos.length > 0) {
                        clientesDirectosHtml += `
                        <h4 style="color:var(--text-primary); margin-top:40px; border-bottom:1px solid var(--border-color); padding-bottom:12px; font-size:16px;">👤 Clientes Directos</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px;">`;
                        clientesDirectos.forEach(cli => {
                            let correosDelCli = correos.filter(c => c.user_id === cli.id);
                            clientesDirectosHtml += `
                            <div class="client-card item-client" style="border-left-color: var(--ec-blue);">
                                <strong style="color: var(--ec-blue);">👤 ${cli.user}</strong>
                                <a href="/admin/del-user/${cli.id}" class="del-btn" onclick="return confirm('¿Borrar cliente?')">×</a>
                                <form action="/admin/add-mail-masivo" method="POST" style="margin-top:15px; display:flex; gap:8px;">
                                    <input type="hidden" name="uid" value="${cli.id}">
                                    <input name="emails" placeholder="Pega los correos..." style="padding:10px; margin:0; font-size:13px;">
                                    <button class="action-btn btn-blue-ec" style="width:auto; padding:10px 15px; font-size:12px;">📥</button>
                                </form>
                                <div class="email-list">`;
                                    correosDelCli.forEach(m => { clientesDirectosHtml += `<div class="email-item"><span>${m.email}</span> <a href="/admin/del-mail/${m.id}" style="color:#f00; text-decoration:none;">×</a></div>`; });
                            clientesDirectosHtml += `</div></div>`;
                        });
                        clientesDirectosHtml += `</div>`;
                    }
                }

                res.send(`
                ${CSS_MODERNO}
                <div style="position: absolute; width: 0; height: 0; overflow: hidden; z-index: -1;">
                    <div id="google_translate_element"></div>
                </div>
                
                <div class="top-header">
                    <h2><span class="brand-ec">⚡ SERVI</span>TEC</h2>
                    <div style="display:flex; align-items:center; gap:20px;">
                        <select class="custom-lang-select" onchange="changeLanguage(this.value)">
                            <option value="es">🇪🇸 ES</option>
                            <option value="en">🇺🇸 EN</option>
                            <option value="pt">🇧🇷 PT</option>
                        </select>
                        <span class="user-badge">${req.session.user} | ${req.session.rol.toUpperCase()}</span>
                        <a href="/logout" style="color:var(--text-secondary); text-decoration:none; font-size:12px; font-weight:700;">SALIR</a>
                    </div>
                </div>
                
                <div class="dashboard-layout">
                    <div class="sidebar">
                        <div class="sidebar-title">Herramientas</div>
                        <button class="tab-btn" onclick="openTab('panel-stream')">📨 Leer Correos</button>
                        <button class="tab-btn" onclick="openTab('panel-auto-reset')">🤖 Auto-Reset Contraseña</button>
                        <button class="tab-btn" onclick="openTab('panel-buscar')">🔎 Buscar Dueño de Cuenta</button>
                        
                        <div class="sidebar-title" style="margin-top:25px;">Gestión</div>
                        <button class="tab-btn" onclick="openTab('panel-registrar')">➕ Crear Nuevo Usuario</button>
                        <button class="tab-btn" onclick="openTab('panel-usuarios')">👥 Base de Usuarios</button>
                        
                        <div class="sidebar-footer">
                        ${esAdminPrincipal ? `
                            <a href="/admin/logout-todos" class="danger-btn-sidebar logout" onclick="return confirm('¿Cerrar sesión de TODOS?')">🛑 Desconectar Todos</a>
                            <a href="/admin/nuke-database" class="danger-btn-sidebar" onclick="return confirm('⚠️ ¿BORRAR TODO EL SISTEMA?')">💥 Formatear Sistema</a>
                        ` : ''}
                        </div>
                    </div>

                    <div class="main-content">
                        <div id="panel-stream" class="tab-panel">
                            <div class="panel-header">
                                <h3>📨 Leer Correos de Plataformas</h3>
                                <p>Rastreo IMAP en tiempo real por correo electrónico.</p>
                            </div>
                            <form action="/buscar" method="POST">
                                <input name="email_search" placeholder="Escribe el correo a buscar (Netflix, Disney, etc)..." required style="border-color: #444; background: rgba(255,255,255,0.03);">
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 10px;">
                                    <button type="submit" name="accion" value="mensaje" class="action-btn btn-yellow-ec">📩 Leer Mensaje</button>
                                    <button type="submit" name="accion" value="pais" class="action-btn btn-blue-ec">🌍 Analizar País</button>
                                    <button type="submit" name="accion" value="ip" class="action-btn btn-red-ec">📡 Buscar IP</button>
                                </div>
                            </form>
                        </div>

                        <!-- 🤖 TAB NUEVO: AUTO-RESET CONTRASEÑA EN TIEMPO REAL -->
                        <div id="panel-auto-reset" class="tab-panel">
                            <div class="panel-header">
                                <h3>🤖 Recuperación y Cambio de Contraseña Automático</h3>
                                <p>Ingresa el correo. El sistema gestionará todo sin intervención humana y colocará la clave fija: <strong style="color:var(--ec-yellow);">teamo203020</strong></p>
                            </div>
                            <form onsubmit="iniciarAutoReset(event)">
                                <input id="email_reset_auto" placeholder="Correo de la cuenta de Netflix..." required style="border-color: var(--ec-blue);">
                                <button type="submit" id="btn-run-reset" class="action-btn btn-yellow-ec">⚡ EJECUTAR CAMBIO AUTOMÁTICO</button>
                            </form>
                            <div id="status-console">
                                <div class="log-step"><span class="log-time">[SISTEMA]</span> <span>Esperando solicitud de automatización...</span></div>
                            </div>
                        </div>

                        <div id="panel-buscar" class="tab-panel">
                            <div class="panel-header">
                                <h3>🔎 Buscar Dueño de Cuenta</h3>
                                <p>Encuentra rápidamente qué cliente tiene asignado un correo específico.</p>
                            </div>
                            <input type="text" id="buscadorLocal" onkeyup="buscarCorreoLocal(); openTab('panel-usuarios');" placeholder="Escribe un correo o nombre aquí para filtrar..." style="border-color:var(--ec-yellow);">
                        </div>

                        <div id="panel-registrar" class="tab-panel">
                            <div class="panel-header">
                                <h3>➕ Crear Nuevo Usuario</h3>
                                <p>Crea perfiles oficiales para nuevos clientes o subadministradores.</p>
                            </div>
                            <form action="/admin/crear" method="POST">
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:18px;">
                                    <input name="n" placeholder="Nombre de Usuario" required>
                                    <input name="c" placeholder="Contraseña" required>
                                </div>
                                <select name="r">
                                    <option value="Cliente">Perfil: Cliente Normal</option>
                                    ${esAdminPrincipal ? '<option value="Subadministrador">Perfil: Subadministrador</option>' : ''}
                                </select>
                                <button class="action-btn btn-blue-ec" style="margin-top:10px;">Crear Cuenta</button>
                            </form>
                        </div>

                        <div id="panel-usuarios" class="tab-panel">
                            <div class="panel-header">
                                <h3>👥 Base de Usuarios</h3>
                                <p>Directorio centralizado. Gestión de subadministradores, clientes y correos.</p>
                            </div>
                            ${subadminsHtml}
                            ${clientesDirectosHtml}
                            ${(!subadminsHtml && !clientesDirectosHtml) ? '<p style="color:#555; text-align:center;">No hay usuarios registrados aún en el sistema.</p>' : ''}
                        </div>
                    </div>
                </div>
                </body>`);
            });
        });
    } else {
        res.send(`
        ${CSS_MODERNO}
        <div style="position: absolute; width: 0; height: 0; overflow: hidden; z-index: -1;">
            <div id="google_translate_element"></div>
        </div>

        <div class="top-header">
            <h2><span class="brand-ec">⚡ SERVI</span>TEC</h2>
            <div style="display:flex; align-items:center; gap:20px;">
                <select class="custom-lang-select" onchange="changeLanguage(this.value)">
                    <option value="es">🇪🇸 ES</option>
                    <option value="en">🇺🇸 EN</option>
                    <option value="pt">🇧🇷 PT</option>
                </select>
                <span class="user-badge">${req.session.user}</span>
                <a href="/logout" style="color:var(--ec-red); text-decoration:none; font-weight:700; font-size:12px;">SALIR</a>
            </div>
        </div>
        <div style="padding: 60px 20px; display:flex; justify-content:center;">
            <div class="tab-panel active" style="margin: 0; width:100%; max-width:600px; display: block; padding: 40px;">
                <div class="panel-header" style="text-align:center;">
                    <h3>📨 Leer Correos</h3>
                    <p>Introduce el correo para extraer el mensaje del streaming.</p>
                </div>
                <form action="/buscar" method="POST">
                    <input name="email_search" placeholder="Correo a buscar..." required style="text-align:center; border-color: #444; background: rgba(255,255,255,0.03);">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px;">
                        <button type="submit" name="accion" value="mensaje" class="action-btn btn-yellow-ec">📩 Leer</button>
                        <button type="submit" name="accion" value="pais" class="action-btn btn-blue-ec">🌍 País</button>
                        <button type="submit" name="accion" value="ip" class="action-btn btn-red-ec">📡 IP</button>
                    </div>
                </form>
            </div>
        </div></body>`);
    }
});

app.post('/admin/crear', (req, res) => {
    let creado_por = (req.session.rol === 'Subadministrador') ? req.session.uid : null;
    db.run("INSERT INTO usuarios (user, pass, rol, creado_por) VALUES (?, ?, ?, ?)", [req.body.n, req.body.c, req.body.r, creado_por], () => res.redirect('/dash'));
});

app.post('/admin/add-mail-masivo', (req, res) => {
    const list = req.body.emails.split(/[\s,]+/).filter(e => e.includes('@'));
    db.all("SELECT c.email, COALESCE(u.user, 'Fantasma/Eliminado') as owner FROM correos c LEFT JOIN usuarios u ON c.user_id = u.id", [], (err, rows) => {
        const correosExistentes = {};
        rows.forEach(r => { correosExistentes[r.email.toLowerCase()] = r.owner; });
        const stmt = db.prepare("INSERT INTO correos (email, user_id) VALUES (?, ?)");
        let insertados = 0, repetidos = [];
        list.forEach(m => {
            let correoLimpio = m.trim().toLowerCase();
            if (correosExistentes[correoLimpio]) repetidos.push(`${correoLimpio}`);
            else { stmt.run(correoLimpio, req.body.uid); insertados++; }
        });
        stmt.finalize(); 
        if (repetidos.length > 0) res.send(`<script>alert('✅ Se guardaron ${insertados} correos.\\n\\n⚠️ Se bloquearon ${repetidos.length} repetidos.'); window.location='/dash';</script>`); 
        else res.redirect('/dash'); 
    });
});

app.get('/admin/del-user/:id', (req, res) => {
    db.run("DELETE FROM usuarios WHERE id = ?", [req.params.id], () => { db.run("DELETE FROM correos WHERE user_id = ?", [req.params.id], () => res.redirect('/dash')); });
});

app.get('/admin/del-mail/:id', (req, res) => { db.run("DELETE FROM correos WHERE id = ?", [req.params.id], () => res.redirect('/dash')); });

app.post('/buscar', async (req, res) => {
    const { email_search, accion } = req.body;
    const config = { imap: { user: MI_CORREO, password: MI_CLAVE, host: 'imap.gmail.com', port: 993, tls: true, tlsOptions: { rejectUnauthorized: false } } };
    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');
        const messages = await connection.search([['TEXT', email_search.trim()]], { bodies: [''], struct: true });
        if (messages.length === 0) { 
            connection.end(); 
            return res.send(`<div style="background:#000; text-align:center; padding:40px; color:white; font-family: 'Inter', sans-serif;"><h2>❌ No se encontró el correo:<br><span style="color:var(--ec-yellow);">${email_search}</span></h2><br><a href="/dash" style="color:var(--text-secondary); text-decoration:none; border: 1px solid #333; padding: 10px 20px; border-radius: 10px;">⬅ VOLVER AL PANEL</a></div>`); 
        }
        messages.sort((a, b) => b.attributes.uid - a.attributes.uid);
        const mail = await simpleParser(messages[0].parts.find(p => p.which === '').body);
        connection.end();
        const textoBruto = mail.text || String(mail.html).replace(/<[^>]*>?/gm, ' ') || "";
        const textoCorreo = textoBruto.toLowerCase();

        // 🛡️ FILTRO DE SEGURIDAD
        const frasesBloqueadas = [
            "confirma el cambio de cuenta",
            "cambio en la información de tu cuenta",
            "restablecer tu contraseña",
            "actualizar tu cuenta",
            "reset your password",
            "update your account",
            "código de verificación para cambiar"
        ];

        const esCorreoProhibido = frasesBloqueadas.some(frase => textoCorreo.includes(frase));

        if (esCorreoProhibido) {
            return res.send(`
                <div style="background:#000; text-align:center; padding:15px;">
                    <a href="/dash" style="color:#fff; text-decoration:none; border: 1px solid #fff; padding: 8px 15px; border-radius: 5px; font-family:'Inter', sans-serif;">⬅ VOLVER AL PANEL</a>
                </div>
                <div style="background:#111; color:white; padding: 40px; text-align:center; font-family:'Inter', sans-serif; min-height:100vh;">
                    <h2>🚫 ACCESO RESTRINGIDO</h2>
                    <p>Correo: <strong style="color:var(--ec-yellow);">${email_search}</strong></p>
                    <div style="margin: 30px auto; padding: 30px; background:#222; border-radius:15px; display:inline-block; border: 1px solid var(--ec-red);">
                        <h3 style="color:var(--ec-red); margin-top:0;">⚠️ Por motivos de seguridad, no se permite visualizar códigos de cambio de cuenta.</h3>
                    </div>
                </div>
            `);
        }

        if (accion === 'pais') {
            let paisDetectado = null;
            const reglasPais = [
                { id: "🇺🇸 Estados Unidos", keys: ['ee. uu.', 'usa', 'united states', 'los gatos', 'california', '1-866-', '1-844-', '1-800-', '1-888-', '1-877-'] },
                { id: "🇫🇷 Francia", keys: ['france', 'francia', 'paris', 's.a.s.', 'des questions'] },
                { id: "🇮🇳 India", keys: ['india', 'mumbai', 'maharashtra', 'llp', '000-800-'] },
                { id: "🇧🇷 Brasil", keys: ['brasil', 'brazil', 'alphaville', 'barueri', 'são paulo', '0800-', 'dúvidas?'] },
                { id: "🇨🇴 Colombia", keys: ['colombia', 'bogota', 'bogotá', '018000', '01 8000'] },
                { id: "🇪🇸 España", keys: ['españa', 'spain', 'madrid', '900 ', '900-'] },
                { id: "🇲🇽 México", keys: ['mexico', 'méxico', 'ciudad de méxico', '800-'] },
                { id: "🇨🇱 Chile", keys: ['chile', 'santiago'] },
                { id: "🇵🇪 Perú", keys: ['peru', 'perú', 'lima'] },
                { id: "🇦🇷 Argentina", keys: ['argentina', 'buenos aires', 'caba'] },
                { id: "🇬🇧 Reino Unido", keys: ['uk', 'united kingdom', 'reino unido', 'london', 'w1t'] },
                { id: "🇳🇱 Sede Europea (Holanda)", keys: ['netherlands', 'holanda', 'países bajos', 'amsterdam', 'international b.v.', 'b.v.'] },
                { id: "🇩🇪 Alemania", keys: ['germany', 'alemania', 'berlin', 'münchen', 'munich', 'fragen?'] },
                { id: "🇯🇵 Japón", keys: ['japan', 'japón', 'tokyo', 'kk'] },
                { id: "🇰🇷 Corea del Sur", keys: ['korea', 'corea', 'seoul'] },
                { id: "🇨🇦 Canadá", keys: ['canada', 'canadá', 'toronto', 'vancouver'] },
                { id: "🇦🇺 Australia", keys: ['australia', 'sydney', 'nsw', '1800-'] },
                { id: "🇿🇦 Sudáfrica", keys: ['south africa', 'sudáfrica', 'johannesburg'] },
                { id: "🇮🇹 Italia", keys: ['italy', 'italia', 'roma', 'milano', 'per domande'] },
                { id: "🇹🇷 Turquía", keys: ['turkey', 'turquía', 'istanbul', 'şişli'] },
                { id: "🇳🇬 Nigeria", keys: ['nigeria', 'lagos'] },
                { id: "🇵🇭 Filipinas", keys: ['philippines', 'filipinas', 'manila'] },
                { id: "🇸🇬 Singapur", keys: ['singapore', 'singapur'] },
                { id: "🇵🇹 Portugal", keys: ['portugal', 'lisboa', 'lisbon'] },
                { id: "🇨🇭 Suiza", keys: ['switzerland', 'suiza', 'zurich'] },
                { id: "🇸🇪 Suecia", keys: ['sweden', 'suecia', 'stockholm'] },
                { id: "🇵🇱 Polonia", keys: ['poland', 'polonia', 'warsaw', 'warszawa'] },
                { id: "🇪🇨 Ecuador", keys: ['ecuador', 'quito', 'guayaquil', 'cuenca'] }
            ];
            for (let regla of reglasPais) { if (regla.keys.some(k => textoCorreo.includes(k))) { paisDetectado = regla.id; break; } }
            let htmlRes = paisDetectado ? `<div style="font-size: 50px; margin: 40px auto; padding: 30px; background:#fff; color:#000; border-radius:15px; display:inline-block; border-bottom: 5px solid var(--ec-red); border-top: 5px solid var(--ec-blue);">${paisDetectado}</div>` : `<div style="margin: 30px auto; padding: 20px; background:#222; border-radius:15px; display:inline-block; border: 1px solid var(--ec-yellow);"><h3 style="color:var(--ec-yellow); margin-top:0;">⚠️ País no detectado</h3></div>`;
            return res.send(`<div style="background:#000; text-align:center; padding:15px;"><a href="/dash" style="color:#fff; text-decoration:none; border: 1px solid #fff; padding: 8px 15px; border-radius: 5px; font-family:'Inter', sans-serif;">⬅ VOLVER AL PANEL</a></div><div style="background:#111; color:white; padding: 40px; text-align:center; font-family:'Inter', sans-serif; min-height:100vh;"><h2>🌍 Análisis de País</h2><p>Correo: <strong style="color:var(--ec-yellow);">${email_search}</strong></p>${htmlRes}</div>`);
        }

        if (accion === 'ip') {
            const ipsEncontradas = textoCorreo.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g);
            let ipUnicas = ipsEncontradas ? [...new Set(ipsEncontradas)].filter(ip => !ip.startsWith('127.') && !ip.startsWith('10.') && !ip.startsWith('192.168.')) : [];
            let ipContenido = ipUnicas.length > 0 ? ipUnicas.map(ip => `<div style="font-size: 35px; color:var(--ec-red); margin:10px 0;">${ip}</div>`).join('') : `<div style="font-size: 20px; color:var(--ec-red); margin: 30px 0;">❌ No se detectó ninguna IP.</div>`;
            return res.send(`<div style="background:#000; text-align:center; padding:15px;"><a href="/dash" style="color:#fff; text-decoration:none; border: 1px solid #fff; padding: 8px 15px; border-radius: 5px; font-family:'Inter', sans-serif;">⬅ VOLVER AL PANEL</a></div><div style="background:#111; color:white; padding: 40px; text-align:center; font-family:'Inter', sans-serif; min-height:100vh;"><h2>📡 Registro de IP</h2><p>Correo: <strong style="color:var(--ec-yellow);">${email_search}</strong></p><div style="margin: 40px auto; padding: 30px; background:#222; border-radius:15px; display:inline-block; border: 1px solid var(--ec-red);">${ipContenido}</div></div>`);
        }
        res.send(`<div style="background:#000; text-align:center; padding:15px;"><a href="/dash" style="color:#fff; text-decoration:none; border: 1px solid #fff; padding: 8px 15px; border-radius: 5px; font-family:'Inter', sans-serif;">⬅ VOLVER AL PANEL</a></div><div style="background:white; color:black; padding: 20px; margin: 0 auto; max-width: 800px; font-family:'Inter', sans-serif;">${mail.html || mail.text}</div>`);
    } catch (e) { res.send(`<div style="background:#000; text-align:center; padding:40px; color:white; font-family: 'Inter', sans-serif;"><h2>⚠️ Error de conexión IMAP</h2><p>${e.message}</p><br><a href="/dash" style="color:#fff; text-decoration:none; border: 1px solid #fff; padding: 10px 20px; border-radius: 10px;">⬅ VOLVER AL PANEL</a></div>`); }
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Panel funcionando correctamente en el puerto ${PORT}`);
});
