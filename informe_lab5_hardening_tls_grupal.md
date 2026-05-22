
# INFORME DE LABORATORIO 5.1  
# Hardening Integral y Seguridad TLS  
## Práctica Grupal - Red entre Pares

**Universidad:** Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca  
**Asignatura:** SIS313 - Infraestructura, Plataformas Tecnológicas y Redes  
**Docente:** Ing. Marcelo Quispe Ortega  
**Integrantes:** [Nombre Integrante 1] - [Nombre Integrante 2]  
**Virtualización:** VirtualBox sobre Windows  
**Sistemas Operativos Utilizados:**  
- Ubuntu Server 26.04 (Servidor Web)  
- Ubuntu Server 24.04 LTS (Servidor DB)

---

# 1. Objetivo

Implementar hardening integral sobre servidores Linux virtualizados, aplicando mecanismos de protección SSH, firewall UFW, cifrado TLS y endurecimiento de servicios.

---

# 2. Entorno del Laboratorio

El laboratorio fue realizado utilizando dos computadoras físicas diferentes ejecutando VirtualBox sobre Windows.

Cada integrante desplegó una máquina virtual con un rol específico:

| VM | Rol | Sistema |
|---|---|---|
| VM Web | Nginx + TLS | Ubuntu Server 26.04 |
| VM DB | MariaDB + Firewall | Ubuntu Server 24.04 LTS |

---

## CAPTURA 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí VirtualBox mostrando ambas VMs  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 3. Configuración de Red Bridge

Se configuró el adaptador de red en modo Bridge.

Pasos realizados:

1. Abrir VirtualBox.
2. Seleccionar VM.
3. Configuración → Red.
4. Adaptador 1 → Bridge Adapter.
5. Seleccionar interfaz física.

---

## CAPTURA 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí configuración Bridge Adapter  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 4. Configuración IP Estática

Archivo editado:

```bash
sudo nano /etc/netplan/50-cloud-init.yaml
```

Configuración aplicada:

```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: no
```

Aplicación:

```bash
sudo netplan apply
```

Verificación:

```bash
ip addr
```

---

## CAPTURA 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí netplan VM Web  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí ip addr VM Web  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí netplan VM DB  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 5. Hardening SSH

Generación de claves:

```bash
ssh-keygen -t ed25519
```

Configuración SSH:

```conf
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
```

Reinicio:

```bash
sudo systemctl restart sshd
```

---

## CAPTURA 6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí ssh-keygen  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí sshd_config  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 6. Configuración UFW

Instalación:

```bash
sudo apt install ufw -y
```

Servidor Web:

```bash
sudo ufw allow 2222/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Servidor DB:

```bash
sudo ufw allow from IP_WEB to any port 3306
```

---

## CAPTURA 8
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí reglas UFW Web  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 9
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí reglas UFW DB  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 7. Instalación Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

Creación del sitio:

```bash
sudo mkdir -p /var/www/lab51.local
```

---

## CAPTURA 10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí página HTML creada  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 8. Instalación MariaDB

```bash
sudo apt install mariadb-server -y
```

Hardening:

```bash
sudo mysql_secure_installation
```

---

## CAPTURA 11
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí mysql_secure_installation  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 9. Generación SSL/TLS

```bash
sudo mkdir -p /etc/nginx/ssl
```

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048
```

---

## CAPTURA 12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí certificado generado  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 10. Configuración HTTPS

Archivo:

```bash
sudo nano /etc/nginx/sites-available/lab51.local
```

Configuraciones:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
server_tokens off;
```

---

## CAPTURA 13
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí configuración TLS  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 11. Pruebas

HTTPS:

```bash
curl -k https://IP_WEB
```

Cabeceras:

```bash
curl -k -I https://IP_WEB
```

TLS:

```bash
openssl s_client -connect IP_WEB:443 -tls1_2
```

---

## CAPTURA 14
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí curl HTTPS  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí cabeceras HTTP  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CAPTURA 16
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
Insertar aquí TLS 1.2 exitoso  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

# 12. Conclusiones

El laboratorio permitió implementar mecanismos de defensa en profundidad utilizando Linux, UFW, SSH Hardened y TLS.

Se verificó el correcto funcionamiento de:

- HTTPS
- Hardening SSH
- Segmentación mediante firewall
- Restricción de servicios
- Protección TLS moderna
