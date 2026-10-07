# Laboratorio 07 — Diseñar un entorno

Aplicación web con **login y CRUD de productos**, desplegada en AWS con **balanceo de carga**.

| | |
|---|---|
| **Alumno** | Oscar Olano — [@oscarjscom](https://github.com/oscarjscom) |
| **Docente** | Jaime Farfán Madariaga |
| **Institución** | Tecsup — Departamento de Tecnología Digital |
| **Curso** | Desarrollo de Soluciones en la Nube — 5 C24 |

> **Aviso:** la aplicación ya no está en línea. Se apagó y se eliminaron los recursos de AWS para evitar cobros, así que el enlace del balanceador ya no funciona.

## Qué hace

- Registro e inicio de sesión (sesión con JWT, sin guardar estado en el servidor).
- Crear, ver, editar y eliminar productos.
- Muestra qué servidor atendió cada petición, para ver el balanceo.

## Cómo estaba armada en AWS

Un Application Load Balancer repartía el tráfico entre dos servidores EC2 en zonas distintas, conectados a una base de datos MySQL en Amazon RDS.

## Cómo ejecutarla

```bash
npm install
npm start
```

Antes de arrancar, copia `.env.example` como `.env` y completa los valores (usa `schema.sql` para crear la base de datos). El `.env` no se sube al repositorio.
