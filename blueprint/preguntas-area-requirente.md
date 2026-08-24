# Preguntas para el área requirente — v00

> Uso sugerido: revisar por bloque en sesiones de levantamiento. Las respuestas alimentan directamente el modelo de datos y las reglas de negocio del blueprint v01.

## 1. Jornadas de distribución

1. ¿Una jornada es siempre nacional (todas las entidades participan) o puede haber jornadas específicas de una sola entidad? siempre es nacional
2. ¿Qué estatus tiene una jornada a lo largo de su ciclo de vida (planeada, en curso, cerrada, cancelada)? ¿Quién la abre y quién la cierra? la abre el administrados nacional y el super administrador
3. ¿Puede haber más de una jornada activa al mismo tiempo? sí
4. ¿Existe un catálogo de tipos de jornada (ordinaria, extraordinaria, emergencia) o todas son del mismo tipo? usa esas categorias ordinaria, extraordinaria y emergencia 

## 2. Rutas

5. ¿La ruta la define un usuario libremente (arma el listado de unidades a mano) o hay algún criterio/optimización (geográfico, capacidad de vehículo, etc.)? la ruta es libre 
6. ¿Una ruta tiene un orden de visita (secuencia) relevante para el sistema, o solo importa el conjunto de unidades? colo importa el conjunto de unidades
7. ¿Una ruta se asocia a un vehículo/transportista/chofer, o eso queda fuera del alcance del sistema? queda fuera del alcance 
8. ¿Puede una misma unidad médica aparecer en más de una ruta dentro de la misma jornada (p. ej. dos entregas distintas)? no
9. ¿Las rutas se reutilizan de una jornada a otra (plantillas) o se capturan desde cero cada vez? se puede usar la ruta anterior como plantilla, recordando que en una jornada una entidad tiene varias rutas a la vez que visitan diferentes unidades del listado

## 3. Programación de distribución

10. ¿La cantidad programada se define por insumo y unidad médica, o también hay una granularidad menor (lote, presentación, caducidad)? la cantidad programada se define por unidad no indicamos que claves se entregan 
11. ¿Existe algún límite o validación de cantidades (contra un inventario disponible, un presupuesto, un tope por unidad)? no 
12. ¿La programación requiere algún flujo de aprobación (p. ej. un supervisor de entidad valida antes de que quede "confirmada"), o el capturista la publica directamente? el capturista la pubica directamente
13. ¿Se puede modificar la programación una vez iniciada la jornada? ¿Con qué controles (justificación, bitácora, quién autoriza)? se puede modificar, pero dejemos la opcion de bloquear la edicion en algun momento dado para todas la unidades con la opcion de desbloquear todas o algunas

## 4. Entrega y evidencia

14. ¿Qué constituye "evidencia suficiente"? ¿Es obligatorio un mínimo de fotos/documentos por entrega, o queda a criterio del capturista? no hay evidencia suficiente, se subira la que tengan, 
15. ¿Se captura firma o nombre de quien recibe en la unidad médica, o solo evidencia fotográfica/documental? no 
16. ¿Qué formatos y tamaños máximos de archivo se deben soportar (foto, video, PDF, documentos)? ¿Hay un límite de duración/peso de video? usaremos foto, video, pdf y documentos, aunque aun no tengo definido donde subiremos los documentos
17. ¿La entrega se registra en tiempo real (en campo, posiblemente sin conexión) o se sube después desde oficina con conectividad? se sube despues desde una oficina con conectividad
18. ¿Qué pasa si la cantidad entregada difiere de la programada? ¿Se debe capturar un motivo/justificación? se registra sin motivo. 
19. ¿Puede haber entregas parciales (se completan en más de una visita) o cada unidad se marca como entregada/no entregada una sola vez por jornada? no

## 5. Comparativo programado vs. entregado

20. ¿Qué nivel de desviación se considera "alerta" (unidad no visitada, insumo faltante, cantidad distinta)? ¿Existen umbrales? no no tenemos umbrales
21. ¿El comparativo debe generar reportes exportables (Excel/PDF) además de vista en pantalla? si generara, vamos a comenzar porque se pueda exportar en un excel los que se capture como programado.
22. ¿Quién necesita ver el comparativo en tiempo real durante la jornada vs. solo al cierre? los administradores nacionales y los super andmin

## 6. Roles y permisos

23. ¿Los roles "programación" y "evidencia" a nivel entidad son siempre usuarios distintos, o una misma persona puede tener ambos roles? una misma persona puede tener ambos
24. ¿Existe algún nivel jerárquico intermedio entre "entidad" y "nacional" (p. ej. jurisdicción sanitaria, región)? no
25. ¿El administrador nacional solo consulta información, o también puede editar/aprobar/rechazar programaciones o entregas? el administrador nacional solo puede ver las programciones que hacen los usuarios 
26. ¿Cuántos usuarios aproximados por entidad y a nivel nacional se esperan (para dimensionar permisos y UI de gestión de usuarios)? 2 por entidad
27. ¿El super administrador es un rol de una sola persona/equipo, o varias personas lo tendrán? lo tendran varias personas

## 7. Catálogos maestros

28. ¿De dónde provienen los catálogos de unidades médicas (CLUES) e insumos? ¿Hay una fuente oficial/sistema externo del que se deban sincronizar, o se capturan manualmente? ingresaremos el catalogo actual de unidades desde (data\raw\CLUES_IMB.xlsx)
29. ¿Con qué frecuencia cambian estos catálogos (altas/bajas/modificaciones de unidades o claves de insumo)? cada mes se actualizara




## 9. No funcionales

34. ¿Cuántos usuarios concurrentes se esperan en periodos pico (durante una jornada activa)? unos 64 usuarios
35. ¿Hay requisitos de disponibilidad/SLA (el sistema es crítico durante los días de jornada)? 
36. ¿Se necesita acceso desde dispositivos móviles en campo? ¿Navegador móvil es suficiente o se contempla app nativa a futuro? por ahora dejaremos fuera los el uso de la plataforma desde dispositivos moviles
37. ¿Hay requisitos de accesibilidad, idioma (¿solo español?) o normativa gubernamental aplicable (p. ej. lineamientos de datos personales, transparencia)? no hay requisitos especiales
38. ¿Dónde se alojará la infraestructura (nube institucional, Railway, on-premise)? ¿Hay restricciones de dónde puede vivir la información (soberanía de datos)? la idea es publicarlo en railway.

## 10. Alcance y fuera de alcance

39. ¿El sistema debe controlar inventario/existencias de insumos, o únicamente programación y seguimiento de distribución (asumiendo que el inventario se gestiona en otro sistema)? solo es para el seguimiento de la distribucin por unidad
40. ¿Se requieren notificaciones automáticas (correo/SMS) ante ciertos eventos (jornada por iniciar, desviación detectada, evidencia faltante)? no
41. ¿Habrá integración con otros sistemas institucionales (por ejemplo, el sistema de Contrataciones visto en el módulo CE, u otros)? no

## 11. Etapas del reemplazo

42. ¿Ya existe una fecha objetivo o jornada de distribución específica para la cual se necesita tener el sistema (o al menos el módulo de programación) operativo? no
43. ¿Cuál es el criterio para dividir el proyecto en etapas: por módulo funcional, por entidad piloto, por región? vamos a crear primero la parte de la captura y despues analizaremos donde pueden capturar lo que se distribuye
44. ¿Habrá una entidad piloto para probar el sistema antes del despliegue nacional? se probara en colima.
