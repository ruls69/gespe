# INFORME DE LABORATORIO 5.1  
# Hardening Integral y Seguridad TLS  
## Práctica Grupal - Red entre Pares

**Universidad:** Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca  
**Facultad:** Facultad de Ciencias y Tecnología  
**Carrera:** Ingeniería en Ciencias de la Computación-TIS, Ingenieria en Sistemas 
**Asignatura:** SIS313 - Infraestructura, Plataformas Tecnológicas y Redes  
**Docente:** Ing. Marcelo Quispe Ortega  
**Laboratorio:** 5.1 - Hardening Integral y Seguridad TLS  
**Modalidad:** Práctica Grupal  
**Integrantes:** Huayta Fuertes Dylan - Gutierrez Torricos Adalid  
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
<img width="401" height="115" alt="Captura de pantalla 2026-05-22 094031" src="https://github.com/user-attachments/assets/9d130eb9-416b-470d-ad9e-10bb78ef30ac" />
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
<img width="561" height="275" alt="image" src="https://github.com/user-attachments/assets/962df189-2cd0-4478-82ca-544d4983d273" />
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
<img width="437" height="315" alt="image" src="https://github.com/user-attachments/assets/53cad843-1309-4926-9901-ad6fe5180af2" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="835" height="263" alt="image" src="https://github.com/user-attachments/assets/3529ae16-d16a-4082-bcee-546108e56815" />
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
<img width="806" height="253" alt="03_netplan" src="https://github.com/user-attachments/assets/fe3be0de-57ed-4ba6-baea-9f14e0ebbf66" />
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
<img width="602" height="121" alt="image" src="https://github.com/user-attachments/assets/1354e529-142b-4be9-91f3-c02de586c58a" />
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
<img width="282" height="118" alt="image" src="https://github.com/user-attachments/assets/f0fd88ba-3b16-4aa3-bfa8-46830f1a0cca" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 9

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="701" height="343" alt="image" src="https://github.com/user-attachments/assets/eac7c1a3-5467-4eac-bcc1-dfca321f232f" />sudo
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
<img width="424" height="210" alt="image" src="https://github.com/user-attachments/assets/8cc49381-1278-40a2-9a34-9298416b284e" />
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
<img width="424" height="210" alt="image" src="https://github.com/user-attachments/assets/b2c05808-ed92-4b62-923e-fa631478cb34" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 7. Instalación de Nginx

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

## CAPTURA 12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="948" height="292" alt="image" src="https://github.com/user-attachments/assets/cd2b5677-a045-41e9-9130-ce2383b19821" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 8. Creación del Sitio Web

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

## CAPTURA 13

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="513" height="62" alt="image" src="https://github.com/user-attachments/assets/80645ff5-d6c3-44fc-854b-331405b85aa7" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 9. Configuración del Virtual Host

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

## CAPTURA 14

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="691" height="569" alt="image" src="https://github.com/user-attachments/assets/aba54b1d-b69c-49a8-81b9-86b3dccc723f" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 15

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="544" height="56" alt="image" src="https://github.com/user-attachments/assets/69224434-a3cd-4d20-8f5d-75e2f90d33a3" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 10. Instalación y Hardening MariaDB

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

## CAPTURA 16

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="735" height="214" alt="image" src="https://github.com/user-attachments/assets/2aab349d-c439-477d-a0e4-e4c7952d0a16" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 17

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="974" height="840" alt="06_base_de_datos" src="https://github.com/user-attachments/assets/da53bc4d-8af2-4816-ba04-3f54552b857c" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 10.1 Configuración bind-address

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

## CAPTURA 18

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="965" height="861" alt="07_cambio_bind" src="https://github.com/user-attachments/assets/3ce7dc44-f003-49a4-9ac3-c69312407177" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 11. Configuración SSL/TLS

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

## CAPTURA 19

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="975" height="839" alt="01_certificado_TLS" src="https://github.com/user-attachments/assets/9d70eefa-50fc-40c2-881f-cd5d91f7ed73" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 12. Configuración HTTPS

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

## CAPTURA 20

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="692" height="566" alt="image" src="https://github.com/user-attachments/assets/296abf8f-0721-47d3-9db5-6fbbc134c546" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 21

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="544" height="56" alt="Captura de pantalla 2026-05-22 095457" src="https://github.com/user-attachments/assets/1e17005b-e037-4a54-800b-9362a2db871d" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 13. Pruebas de Seguridad

## 13.1 Verificación HTTPS

```bash
curl -k https://10.204.145.210
```

---

## CAPTURA 22

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="503" height="61" alt="010_verificacion" src="https://github.com/user-attachments/assets/4dce7046-4ae7-4143-bd68-ea01121b1653" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 13.2 Verificación de Cabeceras

```bash
curl -k -I https://10.204.145.210
```

Cabeceras verificadas:

- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options

---

## CAPTURA 23

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="624" height="299" alt="02_cabeceras_de_seguridad" src="https://github.com/user-attachments/assets/eedbee3c-bd26-4fb2-8d62-83ef3ba5f65d" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 13.3 Verificación TLS

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

## CAPTURA 24

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="963" height="641" alt="image" src="https://github.com/user-attachments/assets/a9c30fc6-9599-4d22-8bd2-f4501c7b65c0" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 25

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="936" height="444" alt="Captura de pantalla 2026-05-21 121122" src="https://github.com/user-attachments/assets/741fa8fe-cf7b-45ba-9281-a5e85bf23f5a" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## 13.4 Verificación de Segmentación

Prueba de acceso MariaDB:

```bash
nc -vz 10.204.145.211 3306
```

---

## CAPTURA 26

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
<img width="669" height="294" alt="Captura de pantalla 2026-05-20 212154" src="https://github.com/user-attachments/assets/5013e84a-9533-4d6b-8282-2a9db1ddfe24" />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 14. Conclusiones

El laboratorio permitió implementar múltiples mecanismos de seguridad sobre Linux, aplicando hardening de servicios y protección TLS moderna.

Se logró:

- Proteger el acceso SSH
- Restringir puertos mediante UFW
- Segmentar acceso a MariaDB
- Implementar HTTPS seguro
- Configurar TLS moderno
- Aplicar hardening del kernel Linux

Las pruebas realizadas demostraron el correcto funcionamiento del entorno seguro desplegado utilizando Ubuntu Server 26.04 y Ubuntu Server 24.04 LTS.
