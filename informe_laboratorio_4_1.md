# INFORME DE LABORATORIO 4.1
## Plataforma HA, Balanceo de Carga y Monitoreo

**Universidad:** Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca  
**Facultad:** Facultad de Ciencias y Tecnología  
**Carrera:** Ingeniería en Ciencias de la Computación  
**Asignatura:** SIS313 (Infraestructura, Plataformas Tecnológicas y Redes)  
**Docente:** Ing. Marcelo Quispe Ortega  
**Grupo:** Nº 8  
**Universitario:** [Tu Nombre]  
**Gestión:** 2026  

---

## 1. Preparación del Entorno Virtual (VirtualBox)

Se procedió a la creación de tres máquinas virtuales utilizando Ubuntu Server 24.04 LTS.

### 1.1 Configuración de Red

- **Subred:** `192.168.108.0/29`
- **Red interna:** `vlan108`

**Lab4.1-Proxy**
- Adaptador 1: NAT
- Adaptador 2: Red Interna

**Lab4.1-Apps**
- Adaptador 1: Red Interna

**Lab4.1-DB**
- Adaptador 1: Red Interna

📸 CAPTURA REQUERIDA

### 1.2 Reenvío de Puertos

| Nombre | Puerto Host | Puerto Invitado | Propósito |
|--------|------------|----------------|-----------|
| SSH | 2222 | 22 | Acceso remoto |
| PROXY | 80 | 80 | Acceso web |
| GRAFANA | 8080 | 3000 | Monitoreo |

---

## 2. Configuración VM Proxy

```bash
sudo apt update
sudo apt install nginx -y
sudo nginx -t
```

Configuración de balanceo:

```nginx
upstream loadbalancer {
    server 192.168.108.3:3001;
    server 192.168.108.3:3002;
}
```

📸 CAPTURA REQUERIDA

---

## 3. Configuración VM Apps

```bash
nvm install 22
npm install pm2 -g
pm2 start app.js --name app1_3001
pm2 start app.js --name app2_3002
pm2 save
```

📸 CAPTURA REQUERIDA

---

## 4. Configuración VM DB

```sql
CREATE DATABASE db_movies;
CREATE USER 'usr_movies'@'192.168.108.3' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON db_movies.* TO 'usr_movies'@'192.168.108.3';
```

---

## 5. Monitoreo

```yaml
scrape_configs:
  - job_name: 'vlan108-nodes'
```

📸 CAPTURA REQUERIDA

---

## 6. Pruebas de Failover

```bash
pm2 stop 1
```

Resultado: el proxy redirigió el tráfico correctamente.

📸 CAPTURA REQUERIDA

---

## 7. Conclusiones

Se implementó exitosamente una plataforma HA con:
- Balanceo de carga
- Alta disponibilidad
- Monitoreo
- Recuperación ante fallos
