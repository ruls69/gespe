# Informe de Laboratorio: Servicios de Red (DNS y Web)

**Materia:** SIS313 - Infraestructura, Plataformas Tecnológicas y Redes\
**Estudiante:** Adalid Gutiérrez Torricos\
**Docente:** Ing. Marcelo Quispe Ortega

------------------------------------------------------------------------

## 1. Introducción

En el presente laboratorio se desarrolló la implementación de servicios
fundamentales de red mediante la configuración de un servidor web y su
integración con un servidor DNS previamente configurado en trabajo
colaborativo. El objetivo principal fue desplegar correctamente un sitio
web accesible tanto por dirección IP como mediante resolución de nombres
de dominio dentro de una infraestructura de red real asignada por
laboratorio grupal.

Para esta práctica se trabajó específicamente en la configuración del
servidor web utilizando Nginx, estableciendo conectividad con el
servidor DNS del compañero, validando comunicación entre ambas máquinas
y garantizando que el dominio grupal `los-pepes.red` resolviera
correctamente hacia el servidor web configurado.

------------------------------------------------------------------------

## 2. Configuración Inicial de Red del Servidor Web

Como primer paso se configuró manualmente la interfaz de red del
servidor web mediante Netplan, asignando la IP estática correspondiente
dentro del segmento proporcionado para el grupo.

La dirección asignada al servidor web fue:

`10.140.170.201/24`

El gateway y servidor DNS utilizado fue:

`10.140.170.200`

Para ello se modificó el archivo `/etc/netplan/50-cloud-init.yaml`,
donde se estableció que la interfaz `enp0s3` trabajara sin DHCP,
utilizando direccionamiento manual, nameserver y ruta por defecto hacia
el DNS. Posteriormente se aplicaron los cambios para activar la nueva
configuración.

Tras esto se verificó exitosamente mediante `ip a` que la máquina
mostrara correctamente la IP asignada, confirmando así que el servidor
web ya pertenecía correctamente a la red grupal.

------------------------------------------------------------------------

## 3. Validación de Conectividad con el Servidor DNS

Una vez configurada la red, se realizaron pruebas de conectividad usando
`ping` hacia la IP del compañero responsable del DNS (`10.140.170.200`).

Los resultados fueron exitosos, mostrando 0% de pérdida de paquetes y
tiempos de respuesta estables, confirmando que ambas máquinas podían
comunicarse correctamente dentro de la red.

Esta validación fue esencial, ya que garantizó que el servidor web
pudiera depender del DNS para resolución de nombres y acceso grupal.

------------------------------------------------------------------------

## 4. Instalación del Servidor Nginx

Con la conectividad validada, se procedió a instalar Nginx como servicio
web principal.

Durante el primer intento se presentó un bloqueo temporal del sistema
debido a procesos automáticos de actualización (`unattended-upgrades`),
impidiendo la instalación inmediata. Luego de esperar la liberación del
bloqueo, se ejecutó nuevamente la instalación, logrando completar
exitosamente la descarga, desempaquetado e instalación del paquete Nginx
junto con `nginx-common`.

Posteriormente se verificó que Nginx ya estuviera instalado
correctamente y sin errores adicionales.

Una vez instalado, se habilitó el servicio con inicio automático
utilizando `systemctl`, asegurando que Nginx se ejecutara desde el
arranque del sistema operativo.

------------------------------------------------------------------------

## 5. Configuración del Virtual Host

Después de instalar Nginx, se creó la configuración personalizada del
sitio web en `/etc/nginx/sites-available/lab42.local`.

Aunque inicialmente el laboratorio individual trabajó con `lab42.local`,
para la práctica grupal se adaptó el funcionamiento al dominio real
asignado:

`los-pepes.red`

Dentro de la configuración del servidor se estableció:

-   Escucha en puerto 80\
-   `server_name` para dominio principal y `www`\
-   Directorio raíz `/var/www/lab42.local`\
-   Archivo principal `index.html`\
-   Validación de recursos mediante `try_files`

Esta estructura permitió que Nginx respondiera correctamente a
solicitudes realizadas tanto por IP como por nombre de dominio.

Luego se verificó la sintaxis de Nginx mediante `sudo nginx -t`,
obteniendo como resultado:

`syntax is ok`\
`test is successful`

Esto confirmó que no existían errores en la configuración antes de
reiniciar el servicio.

------------------------------------------------------------------------

## 6. Integración con DNS y Resolución de Dominio

Con Nginx operativo, se procedió a validar la correcta resolución DNS
usando:

`nslookup www.los-pepes.red 10.140.170.200`

El resultado devolvió exitosamente:

`www.los-pepes.red -> 10.140.170.201`

Esto confirmó que el servidor DNS del compañero estaba enlazando
correctamente el dominio grupal hacia el servidor web configurado.

Esta fase fue clave, ya que permitió vincular infraestructura DNS + Web
en un entorno funcional completo.

------------------------------------------------------------------------

## 7. Validación desde Navegador

Finalmente, se realizaron pruebas desde navegador utilizando:

-   `http://10.140.170.201`
-   `http://los-pepes.red`

En ambos casos el sistema mostró correctamente la página configurada,
desplegando el mensaje:

**Bienvenido a www.los-pepes.red**\
**Servidor Web funcionando correctamente**\
**Web: Adalid Gutiérrez Torricos**\
**DNS: Dylan Huayta Fuertes**

Esto confirmó que:

-   Nginx servía correctamente el contenido HTML\
-   El dominio resolvía adecuadamente\
-   La integración DNS-Web era completamente funcional\
-   El laboratorio grupal fue completado con éxito

------------------------------------------------------------------------

## 8. Dificultades Encontradas

Durante el proceso se identificaron varios inconvenientes técnicos
relevantes:

-   Bloqueo inicial de instalación por procesos automáticos del sistema\
-   Diferencias entre configuraciones previas de laboratorios
    anteriores\
-   Adaptación del dominio local individual hacia dominio grupal\
-   Necesidad de validar que el DNS externo apuntara correctamente al
    servidor web\
-   Verificación de interfaz correcta (`enp0s3`)

Cada problema fue resuelto mediante revisión técnica, pruebas constantes
y validación de servicios.

------------------------------------------------------------------------

## 9. Resultados Obtenidos

Al finalizar el laboratorio se logró:

-   Configuración exitosa de IP estática en servidor web\
-   Conectividad funcional con DNS grupal\
-   Instalación y habilitación de Nginx\
-   Configuración correcta del Virtual Host\
-   Validación sintáctica de Nginx\
-   Resolución DNS funcional mediante `los-pepes.red`\
-   Acceso exitoso desde navegador por IP y dominio

------------------------------------------------------------------------

## 10. Conclusiones

El desarrollo de este laboratorio permitió comprender de forma práctica
la importancia de la integración entre servicios DNS y Web dentro de una
infraestructura de red colaborativa.

Se reforzaron conocimientos sobre configuración de red estática,
administración de servicios web con Nginx, resolución DNS, validación de
conectividad y solución de errores reales en entornos Linux.

Además, la práctica grupal permitió experimentar cómo distintos roles
dentro de una infraestructura tecnológica dependen entre sí para lograr
un servicio funcional completo, demostrando que la correcta coordinación
entre servidor DNS y servidor Web es esencial para el acceso mediante
dominios personalizados.

En conclusión, esta práctica fortaleció competencias clave en
administración de sistemas, redes y despliegue de servicios,
constituyendo una base sólida para laboratorios más avanzados
relacionados con alta disponibilidad, balanceo de carga y monitoreo.
