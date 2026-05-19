# Laboratorio 3.2: Infraestructura de Red de una Organización con VLANs

Universidad San Francisco Xavier de Chuquisaca  
Asignatura: SIS313 – Infraestructura, Plataformas Tecnológicas y Redes  
Docente: Ing. Marcelo Quispe Ortega  
Semestre: 1/2026
Universitario: Huayta Fuertes Dylan

---

## Introducción

En este laboratorio se implementó una infraestructura virtualizada utilizando VirtualBox. Se configuró un servidor Ubuntu como router principal para realizar enrutamiento entre VLANs, acceso a internet y aplicación de políticas de seguridad mediante UFW.

---

## Topología de Red

- Router-Ubuntu (VLAN 10,20,30,40)
- Server-DMZ1 (192.168.10.2)
- Server-DMZ2 (192.168.10.3)
- PC-TI (192.168.20.2)
- PC-Ventas (192.168.30.2)
- PC-Contabilidad (192.168.40.2)

Con los gateways configurados en el router de la siguiente manera.

<img width="303" height="646" alt="image" src="https://github.com/user-attachments/assets/ef96850e-f75e-495f-b842-1a495b645211" />


## Configuración

Se instalaron paquetes `vlan` y `ufw`, se cargó el módulo `8021q` y se configuraron las subinterfaces `vlan10`, `vlan20`, `vlan30` y `vlan40` mediante Netplan.

<img width="566" height="457" alt="image" src="https://github.com/user-attachments/assets/5d8d4b0b-1b26-4493-a9ad-425560311870" />

Se activó `net.ipv4.ip_forward=1` para permitir el reenvío de paquetes entre VLANs entrando a `/etc/sysctl.conf`.

<img width="533" height="43" alt="image" src="https://github.com/user-attachments/assets/657b591c-4993-4455-ba28-a0f4d84a7d64" />


Se configuraron máquinas Alpine Linux con IP estática, gateway y etiquetado VLAN entrando en `/etc/network/interfaces`.

<img width="568" height="379" alt="image" src="https://github.com/user-attachments/assets/c5173e26-b81d-43cc-b141-1d57d48469f1" />

---

## Verificación

Verificamos que la configuración del router y VLANs esté correcta con ping a sus respectivos gateways.

<img width="564" height="396" alt="image" src="https://github.com/user-attachments/assets/e40ee419-0e8b-4f31-b7e2-c717d7ec58fb" />


Se habilitó UFW y se aplicaron reglas para permitir o denegar acceso entre VLANs según lo pedido.

<img width="491" height="473" alt="image" src="https://github.com/user-attachments/assets/71a40200-2110-47fa-bace-4b51e4056f81" />


---

## Pruebas

Contabilidad tiene acceso a internet.

Ventas no tiene acceso a internet.

SSH permitido/denegado entre VLANs según políticas. Se comprueba haciendo SSH desde DMZ1 a TI y no se logra la conectividad.

<img width="567" height="288" alt="image" src="https://github.com/user-attachments/assets/9188897d-73c3-40ea-bb76-36097452de3d" />


---

## Conclusiones

Se implementó correctamente una red segmentada mediante VLANs.  
Ubuntu Server funcionó como router y firewall.  
Se aplicaron políticas de acceso entre departamentos.
