from django.contrib import admin

from .models import Entidad, UnidadMedica


@admin.register(Entidad)
class EntidadAdmin(admin.ModelAdmin):
    list_display = ["nombre", "coordinador"]
    search_fields = ["nombre"]


@admin.register(UnidadMedica)
class UnidadMedicaAdmin(admin.ModelAdmin):
    list_display = ["clues", "nombre", "entidad", "tipo_unidad_medica", "origen"]
    list_filter = ["entidad", "origen", "tipo_unidad_medica"]
    search_fields = ["clues", "nombre"]
