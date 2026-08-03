import imaplib
import email
import re
import time
from email.header import decode_header

def extract_content_from_email(username, app_password, subject_filter, regex_pattern, max_retries=10):
    """
    Se conecta a Gmail y busca un correo específico para extraer un enlace o código.
    """
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    
    try:
        mail.login(username, app_password)
        mail.select("inbox")
        
        for _ in range(max_retries):
            # Buscar correos no leídos de Netflix
            status, messages = mail.search(None, '(UNSEEN FROM "netflix.com")')
            mail_ids = messages[0].split()
            
            for m_id in reversed(mail_ids):
                res, msg = mail.fetch(m_id, "(RFC822)")
                for response in msg:
                    if isinstance(response, tuple):
                        msg_data = email.message_from_bytes(response[1])
                        subject, encoding = decode_header(msg_data["Subject"])[0]
                        
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding if encoding else "utf-8")
                            
                        # Verificar si el asunto coincide
                        if subject_filter.lower() in subject.lower():
                            # Extraer el cuerpo del mensaje
                            body = ""
                            if msg_data.is_multipart():
                                for part in msg_data.walk():
                                    content_type = part.get_content_type()
                                    if content_type == "text/html" or content_type == "text/plain":
                                        body = part.get_payload(decode=True).decode()
                            else:
                                body = msg_data.get_payload(decode=True).decode()
                            
                            # Buscar el patrón (enlace o código)
                            match = re.search(regex_pattern, body)
                            if match:
                                return match.group(1) if len(match.groups()) > 0 else match.group(0)
            
            time.sleep(5) # Esperar 5 segundos antes de volver a revisar la bandeja
            
        return None
    except Exception as e:
        print(f"Error IMAP: {e}")
        return None
    finally:
        mail.logout()
