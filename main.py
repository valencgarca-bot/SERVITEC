from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
import os
from dotenv import load_dotenv
from netflix_bot import cambiar_clave_netflix

load_dotenv()

app = FastAPI(title="Panel Netflix Auto")

# HTML básico para el panel
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Panel de Restablecimiento</title>
    <style>
        body { font-family: Arial; background-color: #141414; color: white; padding: 50px; }
        .container { max-width: 500px; margin: auto; background: #222; padding: 20px; border-radius: 8px; }
        input, select, button { width: 100%; padding: 10px; margin-top: 10px; border-radius: 4px; border: none; box-sizing: border-box;}
        button { background-color: #e50914; color: white; cursor: pointer; font-weight: bold; margin-top: 20px;}
        button:hover { background-color: #f40612; }
    </style>
</head>
<body>
    <div class="container">
        <h2 style="color: #e50914;">Sistema de Restablecimiento Netflix</h2>
        <form action="/ejecutar" method="post">
            <label>Correo Cliente (Ej: casu34jk+claro1906...):</label>
            <input type="email" name="target_email" required>
            
            <label>Nueva Contraseña:</label>
            <input type="text" name="new_password" required>
            
            <label>Correo Maestro (Bandeja principal):</label>
            <select name="master_account">
                <option value="tokioappoficial@gmail.com">tokioappoficial@gmail.com</option>
                <option value="casu34jk@gmail.com">casu34jk@gmail.com</option>
                <option value="santiagorevend@gmail.com">santiagorevend@gmail.com</option>
            </select>
            
            <button type="submit">Ejecutar Bot</button>
        </form>
    </div>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def home():
    return HTML_TEMPLATE

@app.post("/ejecutar")
async def ejecutar_bot(
    target_email: str = Form(...),
    new_password: str = Form(...),
    master_account: str = Form(...)
):
    # Obtener contraseña de aplicación desde las variables de entorno
    # Dependiendo de la cuenta seleccionada, busca la variable correspondiente
    env_var_map = {
        "tokioappoficial@gmail.com": "MASTER_PASS_TOKIO",
        "casu34jk@gmail.com": "MASTER_PASS_CASU"
    }
    
    var_name = env_var_map.get(master_account)
    master_pass = os.getenv(var_name)
    
    if not master_pass:
        return {"status": "error", "message": f"Contraseña de aplicación no configurada en Render para {master_account}"}
        
    resultado = await cambiar_clave_netflix(target_email, new_password, master_account, master_pass)
    return resultado
