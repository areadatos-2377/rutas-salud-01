from django.db import models


class Entidad(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    coordinador = models.CharField(max_length=150, blank=True)

    class Meta:
        verbose_name = "entidad"
        verbose_name_plural = "entidades"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class UnidadMedica(models.Model):
    ORIGEN_CATALOGO_MENSUAL = "catalogo_mensual"
    ORIGEN_MANUAL = "manual"
    ORIGEN_CHOICES = [
        (ORIGEN_CATALOGO_MENSUAL, "Catálogo mensual (CLUES_IMB.xlsx)"),
        (ORIGEN_MANUAL, "Capturado manualmente"),
    ]

    # CLUES como llave primaria (decisión 2026-08-24, ver blueprint/diagrama-er-v01.md).
    # El catálogo mensual no cubre todos los CLUES reales de programación, por lo que
    # esta tabla también admite altas manuales (origen=manual) para no bloquear la
    # captura cuando un CLUES no aparece en el catálogo oficial.
    clues = models.CharField(max_length=20, primary_key=True)
    nombre = models.CharField(max_length=200)
    entidad = models.ForeignKey(Entidad, on_delete=models.PROTECT, related_name="unidades_medicas")
    tipo_unidad_medica = models.CharField(max_length=50, blank=True)
    municipio = models.CharField(max_length=100, blank=True)
    origen = models.CharField(max_length=20, choices=ORIGEN_CHOICES, default=ORIGEN_MANUAL)

    class Meta:
        verbose_name = "unidad médica"
        verbose_name_plural = "unidades médicas"
        ordering = ["entidad", "nombre"]

    def __str__(self):
        return f"{self.clues} — {self.nombre}"
