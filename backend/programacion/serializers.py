from rest_framework import serializers

from catalogos.models import Entidad
from usuarios.models import Usuario

from .models import Jornada, ProgramacionVisita, Ruta


class JornadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Jornada
        fields = ["id", "nombre", "tipo", "categoria", "fecha_inicio", "fecha_fin", "estatus"]


class RutaSerializer(serializers.ModelSerializer):
    jornada_nombre = serializers.CharField(source="jornada.nombre", read_only=True)
    jornada_categoria = serializers.CharField(source="jornada.categoria", read_only=True)
    entidad_nombre = serializers.CharField(source="entidad.nombre", read_only=True)
    # No requerido aqui: para usuario_entidad el viewset lo fuerza server-side en
    # perform_create y el frontend ni lo manda. Solo super_admin debe mandarlo
    # explicitamente (el viewset valida eso).
    entidad = serializers.PrimaryKeyRelatedField(queryset=Entidad.objects.all(), required=False)

    class Meta:
        model = Ruta
        fields = [
            "id",
            "jornada",
            "jornada_nombre",
            "jornada_categoria",
            "entidad",
            "entidad_nombre",
            "numero_o_nombre",
        ]


class ProgramacionVisitaSerializer(serializers.ModelSerializer):
    unidad_medica_nombre = serializers.CharField(source="unidad_medica.nombre", read_only=True)
    unidad_medica_entidad = serializers.IntegerField(
        source="unidad_medica.entidad_id", read_only=True
    )
    unidad_medica_entidad_nombre = serializers.CharField(
        source="unidad_medica.entidad.nombre", read_only=True
    )
    unidad_medica_municipio = serializers.CharField(
        source="unidad_medica.municipio", read_only=True
    )
    unidad_medica_nivel = serializers.CharField(
        source="unidad_medica.nivel_atencion", read_only=True
    )

    class Meta:
        model = ProgramacionVisita
        fields = [
            "id",
            "jornada",
            "ruta",
            "ruta_numero",
            "unidad_medica",
            "unidad_medica_nombre",
            "unidad_medica_entidad",
            "unidad_medica_entidad_nombre",
            "unidad_medica_municipio",
            "unidad_medica_nivel",
            "fecha_distribucion_programada",
            "claves_a_desplazar",
            "piezas_medicamento",
            "piezas_material_curacion",
            "tipo_unidad_medica",
            "quien_recibe",
            "telefono",
            "correo",
            "bloqueada",
        ]
        read_only_fields = ["jornada", "ruta", "unidad_medica", "bloqueada"]

    def validate(self, attrs):
        request = self.context["request"]
        if self.instance is None:
            raise serializers.ValidationError(
                "Las unidades se precargan automáticamente al crear la jornada."
            )

        if (
            request.user.rol == Usuario.ROL_USUARIO_ENTIDAD
            and self.instance.unidad_medica.entidad_id != request.user.entidad_id
        ):
            raise serializers.ValidationError("No puedes programar sobre una ruta de otra entidad.")
        return attrs
