from django.core.exceptions import ValidationError
from django.db import models

from catalogos.models import Entidad, UnidadMedica


class Jornada(models.Model):
    TIPO_ORDINARIA = "ordinaria"
    TIPO_EXTRAORDINARIA = "extraordinaria"
    TIPO_EMERGENCIA = "emergencia"
    TIPO_CHOICES = [
        (TIPO_ORDINARIA, "Ordinaria"),
        (TIPO_EXTRAORDINARIA, "Extraordinaria"),
        (TIPO_EMERGENCIA, "Emergencia"),
    ]

    # Ciclo de vida completo aun sin definir con el area (ver blueprint-v01.md
    # seccion 9, pendiente #4). Estos 4 estatus son un punto de partida razonable,
    # no una decision cerrada.
    ESTATUS_PLANEADA = "planeada"
    ESTATUS_EN_CURSO = "en_curso"
    ESTATUS_CERRADA = "cerrada"
    ESTATUS_CANCELADA = "cancelada"
    ESTATUS_CHOICES = [
        (ESTATUS_PLANEADA, "Planeada"),
        (ESTATUS_EN_CURSO, "En curso"),
        (ESTATUS_CERRADA, "Cerrada"),
        (ESTATUS_CANCELADA, "Cancelada"),
    ]

    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default=ESTATUS_PLANEADA)

    class Meta:
        verbose_name = "jornada"
        verbose_name_plural = "jornadas"
        ordering = ["-fecha_inicio"]

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"


class Ruta(models.Model):
    jornada = models.ForeignKey(Jornada, on_delete=models.CASCADE, related_name="rutas")
    entidad = models.ForeignKey(Entidad, on_delete=models.PROTECT, related_name="rutas")
    numero_o_nombre = models.CharField(max_length=50)

    class Meta:
        verbose_name = "ruta"
        verbose_name_plural = "rutas"
        ordering = ["jornada", "entidad", "numero_o_nombre"]

    def __str__(self):
        return f"{self.entidad} · Ruta {self.numero_o_nombre} ({self.jornada})"


class ProgramacionVisita(models.Model):
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name="visitas")
    unidad_medica = models.ForeignKey(
        UnidadMedica, on_delete=models.PROTECT, related_name="visitas_programadas"
    )
    fecha_distribucion_programada = models.DateField()
    claves_a_desplazar = models.PositiveIntegerField(default=0)
    piezas_medicamento = models.PositiveIntegerField(default=0)
    piezas_material_curacion = models.PositiveIntegerField(default=0)
    # Capturado por fila (puede diferir del catalogo de la unidad), igual que en
    # tools/captura-programacion/.
    tipo_unidad_medica = models.CharField(max_length=50, blank=True)
    quien_recibe = models.CharField(max_length=150, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    correo = models.EmailField(blank=True)
    # Granularidad de bloqueo sin definir del todo (blueprint-v01.md seccion 9,
    # pendiente #4 del diagrama ER) — por ahora es por fila; un bloqueo a nivel
    # Jornada completa quedaria como una operacion que setea este campo en lote.
    bloqueada = models.BooleanField(default=False)

    class Meta:
        verbose_name = "programación de visita"
        verbose_name_plural = "programaciones de visita"
        ordering = ["ruta", "unidad_medica"]

    def clean(self):
        super().clean()
        # Regla de negocio confirmada: una unidad medica no puede aparecer en mas
        # de una ruta dentro de la misma jornada (blueprint-v01.md seccion 2.2).
        conflicto = (
            ProgramacionVisita.objects.filter(
                ruta__jornada_id=self.ruta.jornada_id,
                unidad_medica_id=self.unidad_medica_id,
            )
            .exclude(pk=self.pk)
            .exists()
        )
        if conflicto:
            raise ValidationError(
                "Esta unidad médica ya está programada en otra ruta de la misma jornada."
            )

    def __str__(self):
        return f"{self.unidad_medica} — {self.fecha_distribucion_programada}"
