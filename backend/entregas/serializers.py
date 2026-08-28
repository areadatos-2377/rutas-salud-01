from rest_framework import serializers

from .models import Entrega, EvidenciaArchivo
from .storage import generar_url_descarga


class EvidenciaArchivoSerializer(serializers.ModelSerializer):
    # ruta_almacen (la key del objeto en R2) nunca se expone -- mismo patron
    # que legacy/referencia_almacenamiento_documentos.md: el frontend solo
    # ve una URL firmada que se genera al vuelo y expira sola.
    url_descarga = serializers.SerializerMethodField()

    class Meta:
        model = EvidenciaArchivo
        fields = ["id", "tipo", "nombre_original", "creado_en", "url_descarga"]
        read_only_fields = fields

    def get_url_descarga(self, obj):
        return generar_url_descarga(obj.ruta_almacen)


class EntregaSerializer(serializers.ModelSerializer):
    evidencias = EvidenciaArchivoSerializer(many=True, read_only=True)

    class Meta:
        model = Entrega
        fields = ["id", "programacion_visita", "entregado", "fecha_entrega", "evidencias"]
        read_only_fields = ["programacion_visita"]
