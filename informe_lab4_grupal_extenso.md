<img width="1914" height="749" alt="Imagen 13" src="https://github.com/user-attachments/assets/3d21c3dc-9a5d-4165-b419-3f2b2ea4b18d" /># INFORME DE LABORATORIO 4.1  
## Plataforma HA, Balanceo de Carga y Monitoreo  
### Práctica Grupal - Centro de Datos

**Universidad:** Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca  
**Asignatura:** SIS313  
**Docente:** Ing. Marcelo Quispe Ortega  
**Grupo:** Nº 8  
**VLAN:** 108  
**Subred:** 192.168.108.0/29  
**Universitarios:**
Huayta Fuertes Dylan CICO-TIS

Arancibia Leon Diego Esteban SIS

Cruz Romero Lilian Ariel SIS

Chambi Lopez Naydelin SIS

---

# 1. Preparación del Entorno

Se inició el laboratorio verificando la correcta asignación de roles entre los integrantes del grupo. Cada máquina virtual fue desplegada en el centro de datos institucional, con una función específica dentro de la arquitectura de alta disponibilidad.

---

## CAPTURA 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="654" height="387" alt="image" src="https://github.com/user-attachments/assets/8ea041fd-d2df-4c8b-9446-c681da183bf4" />

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
<img width="1128" height="385" alt="image" src="https://github.com/user-attachments/assets/03876a18-c1b9-4898-9d99-b017ebae3729" />
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
<img width="880" height="131" alt="image" src="https://github.com/user-attachments/assets/85f1710d-7d17-4add-8957-135a4a199c69" />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CAPTURA 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="672" height="467" alt="image" src="https://github.com/user-attachments/assets/cec8bc7e-d2b6-456a-bd09-0025e67a4f5b" />
 
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
<img width="1233" height="432" alt="image" src="https://github.com/user-attachments/assets/27db04de-76f4-4198-af18-f4f4388e2ee8" />

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
<img width="619" height="319" alt="Imagen2" src="https://github.com/user-attachments/assets/4f8d5020-d96d-4f67-a438-00fda365a181" />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CAPTURA 7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="736" height="81" alt="image" src="https://github.com/user-attachments/assets/c7f2b4af-d717-441a-ac72-da83b6b4bb97" />
  
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
<img width="360" height="41" alt="image" src="https://github.com/user-attachments/assets/6e7e258a-7d61-4478-9cd8-f2a6df071229" />

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
<img width="219" height="173" alt="image" src="https://github.com/user-attachments/assets/f6010b14-19a6-4ca7-a3af-033954d08f01" />

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
<img width="728" height="111" alt="image" src="https://github.com/user-attachments/assets/e13e59ef-01f7-42ba-b47f-84bc2d3c18d1" />
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
<img width="961" height="768" alt="image" src="https://github.com/user-attachments/assets/15c4645c-d734-4766-8a22-561cb759c7cc" />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CAPTURA 12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="1002" height="197" alt="image" src="https://github.com/user-attachments/assets/a46b2561-0f06-4d88-a1bc-e3176e4990f6" />
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
<img width="883" height="251" alt="image" src="https://github.com/user-attachments/assets/7db2a632-ab80-455c-ae16-642fe25f7066" />
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
<img width="736" height="820" alt="Imagen 10" src="https://github.com/user-attachments/assets/a15c8aa9-631d-4236-91a0-1b326cf78930" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 6.3 Grafana

Se importaron dashboards.

---

## CAPTURA 15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="1540" height="540" alt="Imagen 11" src="https://github.com/user-attachments/assets/8661bf9e-3fe1-4539-a899-219fabda5233" /> 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CAPTURA 16
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="1914" height="749" alt="Imagen 13" src="https://github.com/user-attachments/assets/fcc82262-0297-4f5f-8761-604426a8a9ea" />
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
<img width="724" height="109" alt="image" src="https://github.com/user-attachments/assets/18d266e4-d87f-4b3d-8795-612631dee9c2" />
<img width="692" height="212" alt="image" src="https://github.com/user-attachments/assets/6490c03a-dd41-467e-aeb4-cb4aab7cea05" />
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
<img width="663" height="271" alt="image" src="https://github.com/user-attachments/assets/d02df313-5850-42cf-80b7-d55d35d04884" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CAPTURA 19
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="1315" height="778" alt="image" src="https://github.com/user-attachments/assets/b66d3162-b6e1-4608-be0a-702fad2935f8" /> 
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
