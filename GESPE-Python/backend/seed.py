import models
from database import SessionLocal

db = SessionLocal()
nuevo_usuario = models.Usuario(
    email="test@pensionado.com",
    hashed_password="123",  # Contraseña súper simple para el test
    nombre="Pensionado Python",
    rol="pensionado",
    creditos_restantes=10
)
db.add(nuevo_usuario)
db.commit()
db.close()
print("Usuario inyectado en SQLite correctamente.")
