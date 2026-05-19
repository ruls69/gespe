from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import models
from database import engine, get_db

# Crear todas las tablas en la base de datos local (SQLite)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GESPE API (Python)")

# Permitir que React (Frontend) hable con FastAPI (Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción se ponen los puertos de React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# RUTAS DE EJEMPLO (API ENDPOINTS)
# ==========================================

@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido al Servidor GESPE en Python"}

@app.get("/api/platos")
def get_platos(fecha: str = None, db: Session = Depends(get_db)):
    """Devuelve los platos disponibles. Si se envía fecha, filtra por ese día."""
    query = db.query(models.PlatoMenu).filter(models.PlatoMenu.disponible == True)
    if fecha:
        query = query.filter(models.PlatoMenu.fecha == fecha)
    platos = query.all()
    return platos

@app.get("/api/usuarios")
def get_usuarios(rol: str = None, db: Session = Depends(get_db)):
    """Obtiene los usuarios. Esta ruta debería estar protegida con JWT."""
    query = db.query(models.Usuario).filter(models.Usuario.activo == True)
    if rol:
        query = query.filter(models.Usuario.rol == rol)
    return query.all()

@app.post("/api/auth/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    """Simulación básica de Login (En la vida real usaría passlib para desencriptar)"""
    user = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not user or user.hashed_password != password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    if not user.activo:
        raise HTTPException(status_code=403, detail="Tu cuenta está suspendida")
    
    # En la vida real aquí devolveríamos un Token JWT
    return {
        "access_token": "token_simulado_12345",
        "user": {
            "id": user.id,
            "nombre": user.nombre,
            "rol": user.rol,
            "creditos_restantes": user.creditos_restantes
        }
    }
