# RooMe - Aplicación web para la coordinación de alquiler de viviendas para universitarios en Santander, Cantabria

## <ins><img width="80" height="80" alt="image-uvT8LcYBki2O1QqshT6NUI5Uh81k3r" src="https://github.com/user-attachments/assets/06a615bd-09e0-44b6-a260-7dc599301aa8" /> Introducción</ins>
El presente Trabajo Fin de Grado tiene como objetivo el desarrollo de RooMe, una aplicación web diseñada para optimizar la búsqueda de alojamiento compartido y compañeros de piso entre estudiantes universitarios en Santander, Cantabria. Esta solución surge como respuesta a las múltiples dificultades que enfrentan los estudiantes —especialmente los internacionales— al momento de acceder a una vivienda, tales como precios elevados, requisitos exigentes y la falta de confianza en plataformas existentes. RooMe se presenta como una herramienta segura y especializada, que aprovecha la verificación mediante correos institucionales y funcionalidades intuitivas para facilitar la conexión entre estudiantes dentro de un entorno confiable, eficiente y adaptado a sus necesidades reales.

---

## <ins><img width="80" height="80" alt="image-LfpfRdF2BugZEEpTgPQNhXOgbpJBMo" src="https://github.com/user-attachments/assets/24b392cf-82cc-4e54-ab97-1931b284dcc2" /> Características principales</ins>
- **Autenticación segura** con correo institucional (@alumnos.uneatlantico.es)
- **Dos tipos** de publicaciones:
  - 🏠 Habitaciones disponibles
  - 👤 Perfiles para buscar roommates
- Sistema de **filtros avanzados**:
    - Para habitación:
        - Tipo de contrato (fijo o escolar)
        - Requisitos (no fumar, limpieza
        - Puntualidad en pagos, etc)
        - Precio (mínimo y máximo)
    - Para publicación tipo "Perfil RooMe"
        - Género (Mujer, Hombre u otro)
        - Hobbies (deporte, ver películas, escuchar música, etc)
        - Presupuesto (mínimo y máximo) 
- **Gestión completa** de publicaciones (editar, activar/desactivar, eliminar)

---

## <ins><img width="90" height="90" alt="image-T3qYlSLKV0Nh0PeSRW3YIPVgA0Mkqy" src="https://github.com/user-attachments/assets/358c74d3-85e9-4bf5-9159-f80587163c62" />  Stack Tecnológico</ins>
### Frontend
<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/b374c644-162d-4326-801a-c240e0c7b840" />

**Vue.js** - Framework progresivo para interfaces de usuario

### Backend
<img width="250" height="200" alt="image" src="https://github.com/user-attachments/assets/fd318e4c-4101-4c33-8953-d754cf91f2f6" />

**Node.js** con **Express** - Entorno de ejecución y framework web

### Base de Datos
<img width="150" height="150" alt="image" src="https://github.com/user-attachments/assets/13595e02-6443-4702-b916-3e01aed24634" />

**PostgreSQL** - Sistema de gestión de bases de datos relacional

---

## <ins><img width="90" height="90" alt="image-YxKlwIcjJqTAeRHzfEN0Qra6tvwzNQ" src="https://github.com/user-attachments/assets/d90d15ac-f57b-40e8-b106-001fca8cb8d9" /> Plataformas de Despliegue</ins>
<img width="250" height="450" alt="image" src="https://github.com/user-attachments/assets/e1979fdf-baf0-4c8b-b4ef-6052f8102ee2" />

**Vercel** - Para el frontend (https://vercel.com)


<img width="250" height="450" alt="image" src="https://github.com/user-attachments/assets/426607a8-4297-4f13-8d07-657bfa4c42d9" />

**Railway** - Para backend y base de datos (https://railway.app)

---

## <img width="80" height="80" alt="image-uTFTuxrcE5ds9WtgaGUgHWGiqslQzN" src="https://github.com/user-attachments/assets/ce835226-7302-4e92-8019-64e608716645" />  Diagramas UML

- ### <ins>[Modelo de dominio](https://github.com/Dmoga31/TFG_DiegoMorales_RooMe/tree/main/UMLs/Modelo_de_dominio)</ins>
   ![Modelo_de_dominio](https://github.com/user-attachments/assets/5f8fe375-df5b-4ba4-88b9-4280362e598e)

- ### <ins>[Jerarquia de actores](https://github.com/Dmoga31/TFG_DiegoMorales_RooMe/tree/main/UMLs/Jerarquia_de_actores)</ins>
   ![Jerarquia_actores](https://github.com/user-attachments/assets/c4387d90-d09c-4963-8247-65208e51cd1c)

### <ins>Casos de uso</ins>
 - #### [Usuarios no registrados](https://github.com/Dmoga31/TFG_DiegoMorales_RooMe/tree/main/UMLs/Casos_de_uso/Usuario_no_registrado)
   ![Caso_uso_Usuario_no_registrado](https://github.com/user-attachments/assets/8df1bbd4-20f7-48b7-8bed-7ec2f02556af)

 - #### [Estudiante](https://github.com/Dmoga31/TFG_DiegoMorales_RooMe/tree/main/UMLs/Casos_de_uso/Estudiante)
   ![Caso_uso_Estudiante](https://github.com/user-attachments/assets/80a67e09-2401-41ae-a246-017b1610c36d)

 - #### [Administrador](https://github.com/Dmoga31/TFG_DiegoMorales_RooMe/tree/main/UMLs/Casos_de_uso/Administrador)
   ![Caso_uso_Administrador](https://github.com/user-attachments/assets/26ae567a-a28d-47be-9438-37d35d896cf0)

### <ins>Diagramas de contexto</ins>
 - #### [Estudiante](https://github.com/Dmoga31/TFG_DiegoMorales_RooMe/tree/main/UMLs/Diagramas/Diagrama_de_contexto/Estudiante)
   ![Diagrama_contexto_estudiante](https://github.com/user-attachments/assets/298ef061-6096-4801-93dc-ed73c7b07e1e)

 - #### [Administrador](https://github.com/Dmoga31/TFG_DiegoMorales_RooMe/tree/main/UMLs/Diagramas/Diagrama_de_contexto/Administrador)
   ![Diagrama_contexto_administradorsvg](https://github.com/user-attachments/assets/e8b19567-60df-4fd0-9a93-46dceaec8034)

- ### <ins>[Diagrama de entidad-relación](https://github.com/Dmoga31/TFG_DiegoMorales_RooMe/tree/main/UMLs/Diagramas/Diagrama_entidad_relacion)</ins>
  ![ENTIDAD_RELACION](https://github.com/user-attachments/assets/22ace656-88f9-409a-b2ad-98cf821eaaf8)

- ### <ins>[Diagrama de despliegue](https://github.com/Dmoga31/TFG_DiegoMorales_RooMe/tree/main/UMLs/Diagramas/Diagrama_de_despliegue)</ins>
  ![Diagrama_despliegue](https://github.com/user-attachments/assets/0189f9c1-6a87-421e-9d18-e5878b1ce383)

---

##  <ins><img width="75" height="75" alt="image-m2rz3ByBtpzWcsy4J1ktGrep9oCML0" src="https://github.com/user-attachments/assets/190760da-a51d-4fb5-b752-966b644634ef" /> Enlaces a carpetas de diagramas UML<ins>
- [📂 Diagrama de estados](UMLs/Diagramas/Diagramas_de_estados)
- [📂 Especificaciones de casos de uso](https://github.com/Dmoga31/TFG_DiegoMorales_RooMe/tree/main/UMLs/Especificaciones_de_casos_de_uso)



