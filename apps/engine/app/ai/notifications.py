import logging
import smtplib
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


def send_email(to_addresses: list[str], subject: str, body: str) -> None:
    if not settings.smtp_host:
        logger.warning("SMTP not configured, skipping email: %s", subject)
        return
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = ", ".join(to_addresses)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, to_addresses, msg.as_string())


def send_notification(channel: str, recipients: list[str], subject: str, body: str) -> None:
    if channel == "email":
        send_email(recipients, subject, body)
    else:
        # Slack/Telegram/WhatsApp Business (spec section 5) -- wire these up as
        # outbound webhook calls once a tenant actually asks for them; stubbed
        # here so the alert pipeline has a single call site to extend.
        logger.info("Channel '%s' not yet implemented, notification dropped: %s", channel, subject)
