# INFORME DE LABORATORIO 4.1  
## Plataforma HA, Balanceo de Carga y Monitoreo  
### Práctica Grupal - Centro de Datos

**Universidad:** Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca  
**Asignatura:** SIS313  
**Docente:** Ing. Marcelo Quispe Ortega  
**Grupo:** Nº 8  
**VLAN:** 108  
**Subred:** 192.168.108.0/29  
**Universitario:** [Tu Nombre]

---

# 1. Preparación del Entorno

Se inició el laboratorio verificando la correcta asignación de roles entre los integrantes del grupo. Cada máquina virtual fue desplegada en el centro de datos institucional, con una función específica dentro de la arquitectura de alta disponibilidad.

---

## CAPTURA 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Captura de la topología general o diagrama de arquitectura  
**Debe mostrar:** Proxy, App1, App2 y DB  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 2. Configuración de Red

## 2.1 Configuración de la VM Proxy

Se editó el archivo de Netplan:

```bash
sudo nano /etc/netplan/50-cloud-init.yaml
```

Se configuró la VLAN 108 con direccionamiento estático.

```yaml
network:
  version: 2
  vlans:
    vlan108:
      id: 108
      link: ens18
      addresses:
        - 192.168.108.2/29
      routes:
        - to: default
          via: 192.168.108.1
```

Se aplicó la configuración:

```bash
sudo netplan apply
```

Posteriormente se verificó la conectividad:

```bash
ip addr
ping 192.168.108.1
```

Explicación:  
Este paso permitió que la máquina Proxy se integre correctamente a la VLAN asignada.

---

## CAPTURA 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Salida del comando `ip addr` de Proxy  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 2.2 Configuración de Aplicaciones

Se realizó el mismo procedimiento para App1 y App2.

Verificación:

```bash
ping 192.168.108.2
```

---

## CAPTURA 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** `ip addr` de App1  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CAPTURA 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** `ip addr` de App2  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 2.3 Configuración de Base de Datos

Se asignó:

`192.168.108.5/29`

Prueba:

```bash
ping 192.168.108.2
```

---

## CAPTURA 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** `ip addr` de DB  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 3. Implementación del Proxy Inverso

Se instaló Nginx:

```bash
sudo apt update
sudo apt install nginx -y
```

Luego se editó:

```bash
sudo nano /etc/nginx/sites-available/default
```

Configuración aplicada:

```nginx
upstream loadbalancer {
    server 192.168.108.3:3000;
    server 192.168.108.4:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://loadbalancer;
    }
}
```

Se validó la sintaxis:

```bash
sudo nginx -t
```

Reinicio:

```bash
sudo systemctl restart nginx
```

Explicación:  
Nginx distribuye solicitudes entre ambas aplicaciones.

---

## CAPTURA 6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Archivo de configuración Nginx  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CAPTURA 7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Resultado de `sudo nginx -t`  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 4. Despliegue de Aplicaciones

## 4.1 Instalación de Node

```bash
nvm install 22
node -v
npm -v
```

---

## CAPTURA 8
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Verificación de versiones Node/NPM  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 4.2 Clonado

```bash
git clone https://github.com/marceloquispeortega/api-restful-crud-movies
```

Instalación:

```bash
npm install
```

Configuración `.env`

```env
PORT=3000
DB_HOST=192.168.108.5
DB_USER=usr_movies
DB_PASSWORD=secret
DB_NAME=db_movies
```

---

## CAPTURA 9
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Contenido de `.env`  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 4.3 Ejecución PM2

```bash
pm2 start app.js --name app1
pm2 start app.js --name app2
pm2 save
pm2 status
```

Explicación:  
PM2 permite mantener las aplicaciones activas.

---

## CAPTURA 10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Resultado de `pm2 status`  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 5. Configuración MariaDB

Instalación:

```bash
sudo apt install mariadb-server -y
```

Seguridad:

```bash
sudo mysql_secure_installation
```

Creación:

```sql
CREATE DATABASE db_movies;
CREATE USER 'usr_movies'@'192.168.108.%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON db_movies.* TO 'usr_movies'@'192.168.108.%';
FLUSH PRIVILEGES;
```

Inserción de datos.

---

## CAPTURA 11
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Creación de BD  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CAPTURA 12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Tabla movies con registros  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 6. Monitoreo

## 6.1 Node Exporter

```bash
sudo apt install prometheus-node-exporter -y
```

Prueba:

```bash
curl http://localhost:9100/metrics
```

---

## CAPTURA 13
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** métricas Node Exporter  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 6.2 Prometheus

Configuración:

```yaml
scrape_configs:
  - job_name: 'proxy'
  - job_name: 'app1'
  - job_name: 'app2'
  - job_name: 'db'
```

---

## CAPTURA 14
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** archivo prometheus.yml  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 6.3 Grafana

Se importaron dashboards.

---

## CAPTURA 15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Dashboard general  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CAPTURA 16
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** métricas CPU/RAM  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 7. Pruebas de Balanceo

```bash
curl http://192.168.108.2/movies
```

Se realizaron múltiples solicitudes.

---

## CAPTURA 17
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Respuesta alternada App1/App2  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 8. Failover

Se detuvo App2.

```bash
pm2 stop app2
```

Se repitieron pruebas.

---

## CAPTURA 18
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** App2 detenida  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CAPTURA 19
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Insertar aquí:** Respuesta funcionando desde App1  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 9. Conclusiones

La arquitectura desplegada permitió validar el funcionamiento de un entorno HA real.

Se verificó:

- Balanceo correcto
- Recuperación automática
- Persistencia de datos
- Observabilidad

La práctica fortaleció conocimientos de infraestructura moderna y operación distribuida.
