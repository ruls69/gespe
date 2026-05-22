# INFORME DE LABORATORIO 5.1: HARDENING Y SEGURIDAD EN SERVIDORES

**Materia:** SIS313

**Universidad:** Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca

**Estudiantes:** Adalid Gutierrez (Base de Datos) y Dylan Huayta (Servidor Web)

---

## PARTE I: INFORME INDIVIDUAL - BLINDAJE DEL SERVIDOR DE BASE DE DATOS (Adalid)

El objetivo de esta sección es demostrar la configuración segura (Hardening) aplicada al servidor backend de la arquitectura, garantizando su aislamiento y protección contra accesos no autorizados.

### 1. Configuración de Red e IP Estática

Se configuró la interfaz de red en modo puente mediante Netplan para asignar una dirección IP estática dentro de la red local, asegurando la comunicación constante con el servidor web.

```bash
sudo nano /etc/netplan/01-red-puente.yaml
```

![Configuración de Netplan](imagenes/03_netplan.png)
> **Figura 1:** Archivo de configuración de Netplan con la IP estática y la puerta de enlace.


```bash
sudo netplan apply
ip a
```

![Verificación de IP](imagenes/04_ip_a.png)
> **Figura 2:** Verificación de la interfaz mostrando correctamente la IP `10.204.145.211` asignada al servidor de base de datos.


### 2. Hardening del Servicio SSH

Para mitigar ataques de fuerza bruta automatizados, se modificó el archivo de configuración del demonio SSH (`sshd_config`). Se cambió el puerto por defecto (22) al puerto personalizado 2222 y se deshabilitó explícitamente el inicio de sesión remoto para el usuario root (`PermitRootLogin no`).

```bash
sudo nano /etc/ssh/sshd_config
sudo systemctl restart ssh
```

![Hardening de SSH](imagenes/05_hardening_de_ssh.png)
> **Figura 3:** Configuración de Hardening SSH mostrando `Port 2222` y `PermitRootLogin no`.


### 3. Aseguramiento del Motor MariaDB (Bind-Address)

Se ejecutó el script de seguridad `mysql_secure_installation` para eliminar usuarios anónimos y bases de datos de prueba.

```bash
sudo mysql_secure_installation
```

![Aseguramiento de Base de Datos](imagenes/06_base_de_datos.png)
> **Figura 4:** Script interactivo donde se respondió afirmativamente a las medidas para asegurar la instalación de MariaDB.


Además, se modificó el archivo `50-server.cnf` para que el motor de base de datos escuche peticiones exclusivamente en la IP estática asignada (`bind-address = 10.204.145.211`), evitando que responda a interfaces públicas.

```bash
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
sudo systemctl restart mariadb
```

![Cambio de Bind Address](imagenes/07_cambio_bind.png)
> **Figura 5:** Configuración del archivo mostrando `bind-address = 10.204.145.211`.


### 4. Creación de Usuario con Privilegios Mínimos

Se creó un usuario específico (`app_user`) dedicado únicamente a las conexiones provenientes de la IP del servidor web (`10.204.145.210`). Se le otorgaron privilegios exclusivamente sobre su base de datos (`app_db.*`), cumpliendo con el principio de mínimo privilegio.

```bash
sudo mysql -u root -p
```

```sql
CREATE USER 'app_user'@'10.204.145.210' IDENTIFIED BY 'contraseña';
CREATE DATABASE app_db;
GRANT ALL PRIVILEGES ON app_db.* TO 'app_user'@'10.204.145.210';
FLUSH PRIVILEGES;
EXIT;
```

![Creación de Usuario Restringido](imagenes/08_creacion_usuario.png)
> **Figura 6:** Creación del usuario, base de datos y asignación de privilegios restringidos a la IP del servidor web.


### 5. Implementación Estricta de Firewall (UFW)

Se configuró el cortafuegos UFW con una política por defecto de denegación total (`deny incoming`). Se abrieron agujeros precisos y restrictivos: acceso al puerto SSH (2222) solo para la subred local, y acceso al puerto MariaDB (3306) estricta y únicamente para la dirección IP del servidor web.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 10.204.145.0/24 to any port 2222 proto tcp
sudo ufw allow from 10.204.145.210 to any port 3306 proto tcp
sudo ufw enable
sudo ufw status verbose
```

![Reglas del Firewall](imagenes/09_firewall.png)
> **Figura 7:** Estado final del firewall mostrando las reglas activas: puerto 2222 permitido para la subred local y puerto 3306 permitido exclusivamente para la IP `10.204.145.210`.


---

## PRUEBAS DE INTEGRACIÓN Y AUDITORÍA

Esta sección demuestra la correcta segmentación de la red y la comunicación segura entre ambos servidores de la infraestructura (`10.204.145.210` y `10.204.145.211`).

### 6. Auditoría de Seguridad al Servidor Web (Cliente: Base de Datos)

Desde el servidor de Base de Datos se auditaron las medidas de seguridad del Servidor Web.

#### 6.1. Comprobación del Certificado TLS/SSL:

Se utilizó `openssl` para confirmar que el servidor Nginx utiliza encriptación TLSv1.2 mediante un certificado autofirmado emitido para el dominio `seguro-grupo.local`.

```bash
openssl s_client -connect 10.204.145.210:443 -tls1_2 -servername seguro-grupo.local
```

![Certificado TLS](imagenes/01_certificado_TLS.png)
> **Figura 8:** Handshake TLS mostrando el certificado emitido para Chuquisaca y la versión TLSv1.2.


#### 6.2. Comprobación de Cabeceras HTTP de Seguridad:

Se ejecutó una petición mediante `curl` para verificar la aplicación de cabeceras de mitigación (HSTS, X-Frame-Options, X-XSS-Protection).

```bash
curl -I https://seguro-grupo.local --insecure
```

![Cabeceras de Seguridad HTTP](imagenes/02_cabeceras_de_seguridad.png)
> **Figura 9:** Respuesta del servidor mostrando el código `200 OK` y las cabeceras de seguridad configuradas.


### 7. Auditoría de Seguridad a la Base de Datos (Cliente: Servidor Web)

Desde el Servidor Web (Ruls) se intentó acceder al servidor de Base de Datos para comprobar la eficacia del firewall y las credenciales de acceso.

#### 7.1. Comprobación Conjunta de Reglas VIP y Conexión Remota

Para comprobar el correcto blindaje perimetral y lógico, se realizaron los siguientes ataques y pruebas desde el nodo Web:

1. Conexión SSH al puerto por defecto 22 (rechazada por UFW).
2. Escaneo al puerto VIP 3306 con Netcat (permitido por UFW).
3. Conexión remota usando el cliente MariaDB ignorando certificados.

```bash
ssh root@10.204.145.211 -p 22
nc -vz 10.204.145.211 3306
mysql -u app_user -p -h 10.204.145.211 --skip-ssl
SHOW DATABASES;
EXIT;
```

![Verificación Conjunta](imagenes/010_verificacion.png)
> **Figura 10:** Resultado de las auditorías al nodo de Base de Datos comprobando el rechazo de accesos no autorizados y el inicio de sesión remoto exitoso a `app_db`.


---

## CONCLUSIÓN GENERAL

Se logró establecer una arquitectura de red sólida y segura. El servidor Nginx protege la comunicación hacia el exterior mediante cifrado y cabeceras estrictas, mientras que el servidor MariaDB opera en un entorno blindado ("búnker"), aceptando únicamente tráfico de datos de una IP autorizada y bloqueando cualquier intento de intrusión lateral en la red.