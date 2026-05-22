# INFORME DE LABORATORIO 5.1  
# Hardening Integral y Seguridad TLS  
## Práctica Grupal - Red entre Pares

**Universidad:** Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca  
**Facultad:** Facultad de Ciencias y Tecnología  
**Carrera:** Ingeniería en Ciencias de la Computación  
**Asignatura:** SIS313 - Infraestructura, Plataformas Tecnológicas y Redes  
**Docente:** Ing. Marcelo Quispe Ortega  
**Laboratorio:** 5.1 - Hardening Integral y Seguridad TLS  
**Modalidad:** Práctica Grupal  
**Integrantes:** [Nombre Integrante 1] - [Nombre Integrante 2]  
**Virtualización:** Oracle VirtualBox sobre Windows  

## Sistemas Operativos Utilizados

- Ubuntu Server 26.04 (Servidor Web)
- Ubuntu Server 24.04 LTS (Servidor DB)

---

# 1. Objetivo

El objetivo del presente laboratorio fue implementar medidas de hardening y seguridad sobre servidores Linux desplegados en máquinas virtuales, aplicando mecanismos de autenticación segura, endurecimiento de servicios, firewall, cifrado TLS y segmentación de acceso entre servidores.

La práctica fue desarrollada utilizando dos computadoras físicas distintas, ejecutando máquinas virtuales sobre VirtualBox en Windows, permitiendo una comunicación real mediante red en modo Bridge.

---

# 2. Entorno Utilizado

## 2.1 Infraestructura Física

El laboratorio se desarrolló utilizando:

- Dos computadoras físicas diferentes
- Oracle VirtualBox como hipervisor
- Windows como sistema anfitrión
- Red Bridge Adapter para conectividad real
- Ubuntu Server como sistema operativo invitado

---

## 2.2 Máquinas Virtuales Utilizadas

| Máquina Virtual | Rol | Sistema Operativo | Dirección IP |
|---|---|---|---|
| VM Web | Servidor Web Seguro | Ubuntu Server 26.04 | 10.204.145.210 |
| VM DB | Servidor Base de Datos | Ubuntu Server 24.04 LTS | 10.204.145.211 |

### Gateway utilizado

```text
10.204.145.186
```

---

## CAPTURA 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí la ventana principal de VirtualBox mostrando ambas VMs ejecutándose.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 3. Configuración de Red

## 3.1 Configuración del Adaptador Bridge

En ambas máquinas virtuales se configuró el adaptador de red en modo Bridge Adapter para permitir comunicación directa dentro de la red física.

### Pasos realizados

1. Abrir VirtualBox.
2. Seleccionar la máquina virtual.
3. Ingresar a **Configuración → Red**.
4. Habilitar Adaptador 1.
5. Seleccionar **Adaptador Puente (Bridge Adapter)**.
6. Elegir la interfaz física de red del host Windows.

### Explicación

El modo Bridge permitió que las máquinas virtuales se integraran directamente a la red local del laboratorio, obteniendo conectividad real con otros dispositivos y entre ambas computadoras físicas.

---

## CAPTURA 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí la configuración del Adaptador Bridge en VirtualBox.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 4. Configuración IP Estática

## 4.1 Configuración de la VM Web (Ubuntu Server 26.04)

Archivo editado:

```bash
sudo nano /etc/netplan/50-cloud-init.yaml
```

Configuración aplicada:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:
      dhcp4: false
      addresses:
        - 10.204.145.210/24
      routes:
        - to: default
          via: 10.204.145.186
      nameservers:
        addresses:
          - 8.8.8.8
          - 1.1.1.1
```

Aplicación de cambios:

```bash
sudo netplan generate
sudo netplan apply
```

Verificación:

```bash
ip addr
ping 8.8.8.8
```

### Explicación

Se configuró una IP estática para garantizar que el servidor web mantenga una dirección fija durante toda la práctica.

---

## CAPTURA 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el archivo Netplan de la VM Web.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el resultado de `ip addr` en la VM Web.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 4.2 Configuración de la VM DB (Ubuntu Server 24.04 LTS)

Archivo editado:

```bash
sudo nano /etc/netplan/50-cloud-init.yaml
```

Configuración aplicada:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:
      dhcp4: false
      addresses:
        - 10.204.145.211/24
      routes:
        - to: default
          via: 10.204.145.186
      nameservers:
        addresses:
          - 8.8.8.8
```

Aplicación:

```bash
sudo netplan generate
sudo netplan apply
```

Verificación:

```bash
ip addr
ping 10.204.145.210
```

---

## CAPTURA 5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el archivo Netplan de la VM DB.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el resultado de `ip addr` en la VM DB.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 5. Hardening SSH

## 5.1 Generación de Claves SSH

```bash
ssh-keygen -t ed25519 -a 100 -C "lab5-hardening"
```

### Explicación

Las claves ED25519 ofrecen mejor seguridad y rendimiento comparadas con RSA tradicional.

---

## CAPTURA 7

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el resultado del comando `ssh-keygen`.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 5.2 Configuración Segura SSH

Archivo:

```bash
sudo nano /etc/ssh/sshd_config
```

Configuración aplicada:

```conf
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
X11Forwarding no
```

Reinicio:

```bash
sudo systemctl restart ssh
sudo systemctl status ssh
```

### Explicación

Se deshabilitó el acceso root remoto y autenticación por contraseña para reducir riesgos de ataques de fuerza bruta.

---

## CAPTURA 8

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el archivo `sshd_config`.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 9

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el estado del servicio SSH.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 6. Configuración Firewall UFW

## 6.1 Instalación

```bash
sudo apt update
sudo apt install ufw -y
```

---

## 6.2 Configuración del Servidor Web

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 2222/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Activación:

```bash
sudo ufw enable
sudo ufw status verbose
```

---

## CAPTURA 10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí las reglas UFW del servidor Web.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 6.3 Configuración del Servidor DB

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

Permitir únicamente MariaDB desde la VM Web:

```bash
sudo ufw allow from 10.204.145.210 to any port 3306 proto tcp
```

Permitir SSH:

```bash
sudo ufw allow 2222/tcp
```

---

## CAPTURA 11

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí las reglas UFW del servidor DB.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 7. Hardening del Kernel

Archivo:

```bash
sudo nano /etc/sysctl.conf
```

Parámetros agregados:

```conf
net.ipv4.conf.all.rp_filter=1
kernel.sysrq=0
fs.suid_dumpable=0
net.ipv4.icmp_echo_ignore_broadcasts=1
```

Aplicación:

```bash
sudo sysctl -p
```

---

## CAPTURA 12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí la configuración de sysctl.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 8. Instalación de Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

Habilitación:

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

---

## CAPTURA 13

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el estado del servicio Nginx.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 9. Creación del Sitio Web

```bash
sudo mkdir -p /var/www/lab51.local
```

Archivo HTML:

```bash
sudo nano /var/www/lab51.local/index.html
```

Contenido:

```html
<h1>Servidor Seguro - Laboratorio 5.1</h1>
<p>HTTPS y Hardening Activo</p>
```

---

## CAPTURA 14

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el archivo HTML creado.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 10. Configuración del Virtual Host

Archivo:

```bash
sudo nano /etc/nginx/sites-available/lab51.local
```

Configuración:

```nginx
server {
    listen 80;
    server_name lab51.local;

    root /var/www/lab51.local;
    index index.html;
}
```

Activación:

```bash
sudo ln -s /etc/nginx/sites-available/lab51.local /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## CAPTURA 15

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el Virtual Host configurado.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 16

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el resultado de `sudo nginx -t`.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 11. Instalación y Hardening MariaDB

Instalación:

```bash
sudo apt update
sudo apt install mariadb-server -y
```

Verificación:

```bash
sudo systemctl status mariadb
```

Hardening:

```bash
sudo mysql_secure_installation
```

---

## CAPTURA 17

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el estado del servicio MariaDB.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 18

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí `mysql_secure_installation`.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 11.1 Configuración bind-address

Archivo:

```bash
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

Configuración:

```ini
bind-address = 10.204.145.211
```

Reinicio:

```bash
sudo systemctl restart mariadb
```

---

## CAPTURA 19

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí la configuración bind-address.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 12. Configuración SSL/TLS

Creación del directorio:

```bash
sudo mkdir -p /etc/nginx/ssl
```

Generación del certificado:

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
-keyout /etc/nginx/ssl/nginx-selfsigned.key \
-out /etc/nginx/ssl/nginx-selfsigned.crt
```

---

## CAPTURA 20

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí la generación del certificado TLS.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 13. Configuración HTTPS

Archivo:

```bash
sudo nano /etc/nginx/sites-available/lab51.local
```

Configuración aplicada:

```nginx
server {
    listen 443 ssl;
    server_name lab51.local;

    ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;

    ssl_protocols TLSv1.2 TLSv1.3;

    add_header Strict-Transport-Security "max-age=63072000";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    root /var/www/lab51.local;
    index index.html;
}
```

Validación:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## CAPTURA 21

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí la configuración HTTPS/TLS.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 22

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el resultado de `nginx -t` con HTTPS.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 14. Pruebas de Seguridad

## 14.1 Verificación HTTPS

```bash
curl -k https://10.204.145.210
```

---

## CAPTURA 23

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí la prueba HTTPS exitosa.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 14.2 Verificación de Cabeceras

```bash
curl -k -I https://10.204.145.210
```

Cabeceras verificadas:

- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options

---

## CAPTURA 24

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí las cabeceras HTTP de seguridad.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 14.3 Verificación TLS

```bash
openssl s_client -connect 10.204.145.210:443 -tls1_2
```

Prueba TLS antigua:

```bash
openssl s_client -connect 10.204.145.210:443 -tls1_1
```

Resultado esperado:

- TLS 1.2 aceptado
- TLS 1.1 rechazado

---

## CAPTURA 25

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí TLS 1.2 exitoso.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 26

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí el rechazo de TLS 1.1.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 14.4 Verificación de Segmentación

Prueba de acceso MariaDB:

```bash
nc -vz 10.204.145.211 3306
```

---

## CAPTURA 27

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí la prueba del puerto 3306.  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 15. Conclusiones

El laboratorio permitió implementar múltiples mecanismos de seguridad sobre Linux, aplicando hardening de servicios y protección TLS moderna.

Se logró:

- Proteger el acceso SSH
- Restringir puertos mediante UFW
- Segmentar acceso a MariaDB
- Implementar HTTPS seguro
- Configurar TLS moderno
- Aplicar hardening del kernel Linux

Las pruebas realizadas demostraron el correcto funcionamiento del entorno seguro desplegado utilizando Ubuntu Server 26.04 y Ubuntu Server 24.04 LTS.
