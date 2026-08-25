from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class HistoricoMovimientos(models.Model):
    """Bitácora genérica de cambios (blueprint-v01.md sección 5).

    Usa el framework de content types de Django en vez de guardar el nombre
    de tabla como texto libre — es la forma idiomática de modelar "tabla +
    registro afectado" de forma genérica y sigue permitiendo hacer join.
    """

    ACCION_CREACION = "creacion"
    ACCION_MODIFICACION = "modificacion"
    ACCION_ELIMINACION = "eliminacion"
    ACCION_CHOICES = [
        (ACCION_CREACION, "Creación"),
        (ACCION_MODIFICACION, "Modificación"),
        (ACCION_ELIMINACION, "Eliminación"),
    ]

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    registro_afectado = GenericForeignKey("content_type", "object_id")

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="movimientos"
    )
    accion = models.CharField(max_length=20, choices=ACCION_CHOICES)
    valores_antes = models.JSONField(null=True, blank=True)
    valores_despues = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "movimiento histórico"
        verbose_name_plural = "histórico de movimientos"
        ordering = ["-timestamp"]
        indexes = [models.Index(fields=["content_type", "object_id"])]

    def __str__(self):
        return f"{self.get_accion_display()} en {self.content_type} #{self.object_id}"
