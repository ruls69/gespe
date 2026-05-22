Markdown
# INFORME DE LABORATORIO 5.1  
# Hardening Integral y Seguridad TLS  
## Práctica Grupal - Red entre Pares

**Universidad:** Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca  
**Asignatura:** SIS313 - Infraestructura, Plataformas Tecnológicas y Redes  
**Docente:** Ing. Marcelo Quispe Ortega  
**Integrantes:** [Nombre Integrante 1] - [Nombre Integrante 2]  
**Virtualización:** VirtualBox sobre Windows  
**Sistemas Operativos Utilizados:** - Ubuntu Server 26.06 (Servidor Web)  
- Ubuntu Server 24.04 LTS (Servidor DB)

---

# 1. Objetivo

Implementar hardening integral sobre servidores Linux virtualizados, aplicando mecanismos de protección SSH, firewall UFW, cifrado TLS y endurecimiento de servicios dentro de un entorno de red par a par seguro.

---

# 2. Entorno del Laboratorio

El laboratorio fue realizado utilizando dos computadoras físicas diferentes ejecutando VirtualBox sobre Windows. 

Debido a restricciones de seguridad perimetral en la infraestructura física de la red local (**Aislamiento de AP / AP Isolation**), las direcciones MAC virtuales eran bloqueadas e impedían la visibilidad entre hosts. Como medida de contingencia, se desplegó un punto de acceso inalámbrico móvil (**Hotspot**), aislando el entorno de pruebas en un segmento de red libre de bloqueos corporativos.

Cada integrante desplegó una máquina virtual con un rol específico en el puente inalámbrico:

| VM | Rol | Sistema | IP Estática |
|---|---|---|---|
| VM Web | Nginx + TLS + Hardening | Ubuntu Server 26.06 | `10.204.145.210` |
| VM DB | MariaDB + Firewall | Ubuntu Server 24.04 LTS | `10.204.145.211` |

---

## CAPTURA 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí VirtualBox mostrando ambas VMs  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 3. Configuración de Red Bridge

Se configuró el adaptador de red en modo Bridge apuntando a la tarjeta de red inalámbrica activa conectada al Hotspot.

Pasos realizados:
1. Abrir VirtualBox.
2. Seleccionar la VM correspondiente.
3. Configuración → Red.
4. Adaptador 1 → Seleccionar **Adaptador Puente (Bridge Adapter)**.
5. Avanzadas → Cambiar Modo Promiscuo a **Permitir todo (Allow All)**.

---

## CAPTURA 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí configuración Bridge Adapter  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 4. Configuración IP Estática

Archivo editado en el Servidor Web:
```bash
sudo nano /etc/netplan/50-cloud-init.yaml
Configuración aplicada (VM Web):

YAML
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: no
      addresses:
        - 10.204.145.210/24
      routes:
        - to: default
          via: 10.204.145.186
      nameservers:
        addresses:
          - 8.8.8.8
          - 1.1.1.1
Configuración aplicada (VM DB):

YAML
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: no
      addresses:
        - 10.204.145.211/24
      routes:
        - to: default
          via: 10.204.145.186
      nameservers:
        addresses:
          - 8.8.8.8
Aplicación y verificación de cambios:

Bash
sudo netplan apply
ip addr
CAPTURA 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí netplan VM Web

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPTURA 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí ip addr VM Web

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPTURA 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí netplan VM DB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. Hardening SSH
Para la versión de Ubuntu Server de la VM Web, se mitigó el vector de ataque por fuerza bruta reestructurando OpenSSH para deshabilitar su arquitectura por sockets y forzar el uso del servicio tradicional.

Comandos de control del servicio:

Bash
sudo systemctl disable --now ssh.socket
sudo systemctl enable --now ssh.service
Generación de claves criptográficas seguras (Ed25519) desde el cliente:

Bash
ssh-keygen -t ed25519 -C "ruls@seguro-grupo.local"
ssh-copy-id -p 2222 ruls@10.204.145.210
Modificación del archivo de configuración del demonio (sudo nano /etc/ssh/sshd_config):

Fragmento de código
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
Reinicio y aplicación:

Bash
sudo systemctl restart ssh
CAPTURA 6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí ssh-keygen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPTURA 7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí sshd_config

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. Configuración UFW
Se instaló el cortafuegos perimetral interno aplicando políticas estrictas de denegación por defecto para tráfico entrante y permitiendo únicamente los servicios auditados.

Bash
sudo apt install ufw -y
sudo ufw default deny incoming
sudo ufw default allow outgoing
Servidor Web:

Bash
sudo ufw allow 2222/tcp comment 'SSH Endurecido'
sudo ufw allow 80/tcp comment 'Redirección HTTP'
sudo ufw allow 443/tcp comment 'HTTPS Cifrado'
sudo ufw enable
Servidor DB:

Bash
sudo ufw allow from 10.204.145.210 to any port 3306 comment 'Tráfico MariaDB exclusivo desde Web'
sudo ufw allow 2222/tcp comment 'SSH de Administración'
sudo ufw enable
CAPTURA 8
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí reglas UFW Web (sudo ufw status)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPTURA 9
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí reglas UFW DB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. Instalación y Hardening de Nginx
Bash
sudo apt update
sudo apt install nginx -y
Creación del directorio raíz del sitio seguro y asignación de permisos al propietario del proceso web (www-data):

Bash
sudo mkdir -p /var/www/seguro-grupo.local
echo "<h1>Infraestructura Web Segura</h1><p>Administrador: ruls</p>" | sudo tee /var/www/seguro-grupo.local/index.html
sudo chown -R www-data:www-data /var/www/seguro-grupo.local
sudo chmod -R 755 /var/www/seguro-grupo.local
CAPTURA 10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí página HTML creada e indexada

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

8. Instalación MariaDB
Bash
sudo apt install mariadb-server -y
Aseguramiento del motor de base de datos eliminando accesos anónimos, tablas de prueba y deshabilitando el login remoto del usuario root:

Bash
sudo mysql_secure_installation
CAPTURA 11
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí mysql_secure_installation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

9. Generación SSL/TLS
Creación del repositorio de llaves y generación de un certificado digital X.509 robusto autofirmado parametrizado para la institución con una validez de 365 días:

Bash
sudo mkdir -p /etc/nginx/ssl
Bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx-selfsigned.key \
  -out /etc/nginx/ssl/nginx-selfsigned.crt \
  -subj "/C=BO/ST=Chuquisaca/L=Sucre/O=USFX/OU=SIS313/CN=seguro-grupo.local"
CAPTURA 12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí certificado generado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

10. Configuración HTTPS
Edición del archivo del bloque de servidor (sudo nano /etc/nginx/sites-available/seguro-grupo.local):

Nginx
server {
    listen 80;
    server_name seguro-grupo.local 10.204.145.210;
    return 301 [https://seguro-grupo.local](https://seguro-grupo.local)$request_uri;
}

server {
    listen 443 ssl;
    server_name seguro-grupo.local 10.204.145.210;

    ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;

    # Hardening TLS y mitigación de fugas de información
    ssl_protocols TLSv1.2 TLSv1.3;
    server_tokens off;

    # Inyección de cabeceras de seguridad
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    root /var/www/seguro-grupo.local;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
Activación mediante enlace simbólico y descarte del sitio por defecto:

Bash
sudo ln -s /etc/nginx/sites-available/seguro-grupo.local /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
CAPTURA 13
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí configuración TLS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

11. Pruebas y Auditoría de Seguridad
A. Redirección Insegura a Segura (HTTP -> HTTPS)
Bash
curl -I [http://10.204.145.210](http://10.204.145.210)
Resultado esperado: Retorno de código de estado HTTP/1.1 301 Moved Permanently apuntando a la dirección cifrada.

B. Consumo del Recurso Local
Bash
curl -k [https://10.204.145.210](https://10.204.145.210)
C. Auditoría de Cabeceras Inyectadas
Bash
curl -k -I [https://10.204.145.210](https://10.204.145.210)
Resultado verificado: Exposición correcta de las directivas contra ataques cross-site (HSTS, X-Frame-Options, X-XSS-Protection).

D. Negociación Criptográfica y Validación de Protocolos
Conexión exitosa bajo estándar moderno:

Bash
openssl s_client -connect 10.204.145.210:443 -tls1_2 </dev/null
Rechazo e interrupción de conexión ante protocolo obsoleto (Demostración de Hardening TLS):

Bash
openssl s_client -connect 10.204.145.210:443 -tls1_1 </dev/null
Resultado verificado: error:0A0000BF:SSL routines:tls_setup_handshake:no protocols available, comprobando que Nginx rechaza degradaciones de cifrado.

CAPTURA 14
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí curl con código 301 o contenido HTML

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPTURA 15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí cabeceras HTTP expuestas con código 200 OK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPTURA 16
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insertar aquí error de handshake TLS 1.1 bloqueado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

12. Conclusiones
El laboratorio permitió implementar mecanismos de defensa en profundidad utilizando Linux, UFW, SSH Hardened y TLS en arquitecturas modernas de Ubuntu Server.

Se verificó el correcto funcionamiento de:

Redirección automática hacia canales cifrados HTTPS.

Bloqueo y protección ante escaneos masivos en puertos de administración mediante llaves Ed25519.

Segmentación estricta de tráfico a nivel de base de datos mediante reglas ip-source de firewall.

Mitigación absoluta de ataques de degradación de cifrado (Downgrade Attacks) mediante la exclusión de TLSv1.1 e inyección HSTS.

Resolución de contingencias locales mediante aislamiento de tráfico en interfaces puente inalámbricas independientes.
