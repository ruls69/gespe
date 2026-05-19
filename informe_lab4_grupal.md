# INFORME DE LABORATORIO 4.1  
## Plataforma HA, Balanceo de Carga y Monitoreo (Práctica Grupal - Centro de Datos)

**Universidad:** Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca  
**Facultad:** Facultad de Ciencias y Tecnología  
**Carrera:** Ingeniería en Ciencias de la Computación  
**Asignatura:** SIS313 - Infraestructura, Plataformas Tecnológicas y Redes  
**Docente:** Ing. Marcelo Quispe Ortega  
**Grupo:** Nº 8  
**VLAN:** 108  
**Subred:** 192.168.108.0/29  
**Universitarios:** 
Huayta Fuertes Dylan CICO-TIS
Arancibia Leon Diego Esteban SIS
Cruz Romero Lilian Ariel SIS
Chambi Lopez Naydelin
**Gestión:** 1/2026  

---

# 1. Objetivo

Implementar una arquitectura web de alta disponibilidad en entorno de centro de datos, integrando balanceo de carga, monitoreo, tolerancia a fallos y segregación mediante VLAN.

---

# 2. Arquitectura Implementada

| Rol | IP |
|-----|----|
| Gateway | 192.168.108.1 |
| Proxy + Monitoring | 192.168.108.2 |
| Aplicación 1 | 192.168.108.3 |
| Aplicación 2 | 192.168.108.4 |
| Base de Datos | 192.168.108.5 |

📸 **CAPTURA REQUERIDA:** Topología general.

---

# 3. Configuración de Red

## 3.1 Proxy

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

## 3.2 Aplicaciones

```yaml
addresses:
  - 192.168.108.3/29
```

```yaml
addresses:
  - 192.168.108.4/29
```

## 3.3 Base de Datos

```yaml
addresses:
  - 192.168.108.5/29
```

Aplicación:

```bash
sudo netplan apply
ip addr
```

📸 **CAPTURA REQUERIDA:** salida de `ip addr`.

---

# 4. Configuración del Proxy Inverso

Instalación:

```bash
sudo apt update && sudo apt install nginx -y
```

Configuración:

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

Validación:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

📸 **CAPTURA REQUERIDA**

---

# 5. Aplicaciones Node.js

Instalación:

```bash
nvm install 22
npm install pm2 -g
```

Clonado:

```bash
git clone https://github.com/marceloquispeortega/api-restful-crud-movies
```

Variables de entorno:

```env
PORT=3000
DB_HOST=192.168.108.5
DB_USER=usr_movies
DB_PASSWORD=secret
DB_NAME=db_movies
```

Ejecución:

```bash
pm2 start app.js --name app1
pm2 start app.js --name app2
pm2 save
```

📸 **CAPTURA REQUERIDA:** `pm2 status`

---

# 6. Base de Datos MariaDB

Instalación:

```bash
sudo apt install mariadb-server -y
```

Configuración:

```sql
CREATE DATABASE db_movies;

CREATE USER 'usr_movies'@'192.168.108.%' IDENTIFIED BY 'secret';

GRANT ALL PRIVILEGES ON db_movies.* TO 'usr_movies'@'192.168.108.%';

FLUSH PRIVILEGES;
```

Carga de datos:

```sql
INSERT INTO movies (title, year) VALUES
('Inception',2010),
('The Matrix',1999),
('Interstellar',2014);
```

📸 **CAPTURA REQUERIDA**

---

# 7. Monitoreo

## Prometheus

```yaml
scrape_configs:
  - job_name: 'proxy'
    static_configs:
      - targets: ['192.168.108.2:9100']

  - job_name: 'app1'
    static_configs:
      - targets: ['192.168.108.3:9100']

  - job_name: 'app2'
    static_configs:
      - targets: ['192.168.108.4:9100']

  - job_name: 'db'
    static_configs:
      - targets: ['192.168.108.5:9100']
```

## Grafana

Dashboards importados:

- Node Exporter Full (1860)
- Node Exporter Full with Node Name (10242)

Acceso:

`https://vlan108-monitoring.rootcode.com.bo`

📸 **CAPTURA REQUERIDA**

---

# 8. Pruebas de Balanceo

```bash
curl http://192.168.108.2/movies
```

Resultados:

- Respuesta alternada App1
- Respuesta alternada App2

📸 **CAPTURA REQUERIDA**

---

# 9. Simulación de Fallo

Detención de App 2:

```bash
pm2 stop app2
```

Resultado:

El balanceador redirigió automáticamente tráfico a App 1.

📸 **CAPTURA REQUERIDA**

---

# 10. Resultados

Se comprobó:

- Balanceo funcional
- Alta disponibilidad
- Persistencia de datos
- Monitoreo en tiempo real
- Failover automático

---

# 11. Conclusiones

La práctica permitió desplegar una arquitectura distribuida real dentro del centro de datos institucional.

Se reforzaron competencias en:

- Administración Linux
- Redes VLAN
- Proxy inverso
- Alta disponibilidad
- Observabilidad
- Resolución colaborativa de incidencias

La plataforma mantuvo disponibilidad incluso ante la caída de uno de los nodos de aplicación, validando el correcto funcionamiento del esquema HA.

---

# 12. Bitácora de Comandos

## Proxy

```bash
sudo apt install nginx prometheus grafana
sudo nginx -t
sudo systemctl restart nginx
```

## Apps

```bash
pm2 start app.js
pm2 save
```

## DB

```bash
sudo mysql_secure_installation
```
