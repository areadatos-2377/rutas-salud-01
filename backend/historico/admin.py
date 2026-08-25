from django.contrib import admin

from .models import HistoricoMovimientos


@admin.register(HistoricoMovimientos)
class HistoricoMovimientosAdmin(admin.ModelAdmin):
    list_display = ["timestamp", "usuario", "accion", "content_type", "object_id"]
    list_filter = ["accion", "content_type"]
    readonly_fields = [f.name for f in HistoricoMovimientos._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
