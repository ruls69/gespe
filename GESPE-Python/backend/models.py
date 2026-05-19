from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    nombre = Column(String)
    rol = Column(String) # 'administrador', 'cajero', 'pensionado'
    creditos_restantes = Column(Integer, default=0)
    activo = Column(Boolean, default=True)

class PlatoMenu(Base):
    __tablename__ = "platos_menu"

    id = Column(String, primary_key=True, default=generate_uuid)
    fecha = Column(String) # Guardaremos la fecha como YYYY-MM-DD
    categoria = Column(String)
    nombre = Column(String)
    precio_venta_libre = Column(Float, default=0.0)
    disponible = Column(Boolean, default=True)

class Asistencia(Base):
    __tablename__ = "asistencias_pensionados"

    id = Column(String, primary_key=True, default=generate_uuid)
    usuario_id = Column(String, ForeignKey("usuarios.id"))
    fecha = Column(String)
    estado = Column(String, default="pendiente")
    modalidad = Column(String, default="local")
    
    seleccion_entrada_id = Column(String, ForeignKey("platos_menu.id"), nullable=True)
    seleccion_fuerte_id = Column(String, ForeignKey("platos_menu.id"), nullable=True)
    seleccion_postre_id = Column(String, ForeignKey("platos_menu.id"), nullable=True)
    
    usuario = relationship("Usuario")
    entrada = relationship("PlatoMenu", foreign_keys=[seleccion_entrada_id])
    fuerte = relationship("PlatoMenu", foreign_keys=[seleccion_fuerte_id])
    postre = relationship("PlatoMenu", foreign_keys=[seleccion_postre_id])
