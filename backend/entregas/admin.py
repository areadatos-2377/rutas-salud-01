from django.contrib import admin

from .models import Entrega, EvidenciaArchivo


class EvidenciaArchivoInline(admin.TabularInline):
    model = EvidenciaArchivo
    extra = 0


@admin.register(Entrega)
class EntregaAdmin(admin.ModelAdmin):
    list_display = ["programacion_visita", "entregado", "fecha_entrega", "usuario"]
    list_filter = ["entregado"]
    inlines = [EvidenciaArchivoInline]
