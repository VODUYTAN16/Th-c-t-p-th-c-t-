from app.services.db_service import db_service

# Alias for backward compatibility in imports
db = db_service


async def connect_db() -> None:
    pass


async def disconnect_db() -> None:
    pass
