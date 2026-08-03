from playwright.async_api import async_playwright
import asyncio
from email_handler import extract_content_from_email

async def cambiar_clave_netflix(target_email, new_password, master_email, master_pass):
    async with async_playwright() as p:
        # Iniciamos el navegador en modo headless (invisible para el servidor)
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            # ==========================================
            # PLAN A: Restablecimiento Directo
            # ==========================================
            print("Ejecutando Plan A...")
            await page.goto("https://www.netflix.com/loginhelp")
            
            # Seleccionar email e ingresar el correo objetivo
            await page.locator('input[type="radio"][value="email"]').check()
            await page.fill('input[name="forgot_password_input"]', target_email)
            await page.click('button[data-uia="action_forgot_password"]')
            
            # Esperar el correo de restablecimiento (Plan A)
            link_reset = extract_content_from_email(
                username=master_email,
                app_password=master_pass,
                subject_filter="completa tu solicitud de restablecimiento",
                regex_pattern=r'href="(https://www\.netflix\.com/password\?g=[^"]+)"'
            )
            
            if not link_reset:
                raise Exception("Plan A falló: No llegó el correo o reCAPTCHA bloqueó el envío.")
                
            # Ir al enlace y cambiar la contraseña
            await page.goto(link_reset)
            await _ejecutar_cambio_clave(page, new_password)
            await browser.close()
            return {"status": "success", "method": "Plan A", "message": "Contraseña cambiada con éxito."}

        except Exception as e:
            print(f"Plan A falló ({e}). Saltando a Plan B...")
            
            # ==========================================
            # PLAN B: Inicio por Código + Alerta Nuevo Dispositivo
            # ==========================================
            try:
                await page.goto("https://www.netflix.com/login")
                
                # Iniciar con código
                await page.click('button:has-text("Iniciar sesión con código")') # Ajustar selector si Netflix lo cambia
                await page.fill('input[name="userLoginId"]', target_email)
                await page.click('button:has-text("Enviar código")')
                
                # Esperar el código OTP en el correo
                otp_code = extract_content_from_email(
                    username=master_email,
                    app_password=master_pass,
                    subject_filter="código de inicio de sesión",
                    regex_pattern=r'\b(\d{4,6})\b'
                )
                
                if not otp_code:
                    raise Exception("Plan B falló: No llegó el código OTP.")
                    
                # Ingresar código y entrar
                await page.fill('input[name="otpCode"]', otp_code)
                await page.click('button[data-uia="login-submit-button"]')
                
                # Esperar unos segundos para que Netflix envíe la alerta de Nuevo Dispositivo
                await asyncio.sleep(5)
                
                # Extraer enlace de alerta de nuevo dispositivo
                link_alerta = extract_content_from_email(
                    username=master_email,
                    app_password=master_pass,
                    subject_filter="nuevo dispositivo",
                    regex_pattern=r'href="(https://www\.netflix\.com/password\?[^"]+)"' # Patrón extraído de tu imagen
                )
                
                if not link_alerta:
                    raise Exception("Plan B falló: No llegó el correo de alerta de nuevo dispositivo.")
                    
                # Ir al enlace y cambiar la contraseña
                await page.goto(link_alerta)
                await _ejecutar_cambio_clave(page, new_password)
                await browser.close()
                return {"status": "success", "method": "Plan B", "message": "Contraseña cambiada con éxito mediante alerta de dispositivo."}
                
            except Exception as e_b:
                await browser.close()
                return {"status": "error", "message": f"Ambos planes fallaron. Detalles: {e_b}"}


async def _ejecutar_cambio_clave(page, new_password):
    """Función auxiliar para llenar el formulario de nueva contraseña."""
    # Llenar contraseñas
    await page.fill('input[name="newPassword"]', new_password)
    await page.fill('input[name="confirmNewPassword"]', new_password)
    
    # Desmarcar "Cerrar sesión en todos los dispositivos" si está marcado
    checkbox = page.locator('input[name="signOutOfAllDevices"]')
    is_checked = await checkbox.is_checked()
    if is_checked:
        await page.locator('label:has(input[name="signOutOfAllDevices"])').click() # Clic en el label para desmarcar
        
    # Guardar
    await page.click('button[data-uia="action_save_password"]')
