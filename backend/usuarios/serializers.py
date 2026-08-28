from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from catalogos.models import Entidad

from .models import Usuario


class UsuarioMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "username", "first_name", "last_name", "rol", "entidad"]


class UsuarioSerializer(serializers.ModelSerializer):
    entidad_nombre = serializers.CharField(source="entidad.nombre", read_only=True)
    # No requerido: solo usuario_entidad debe traerlo, y Usuario.clean() ya
    # exige/prohibe segun el rol -- mismo patron que RutaSerializer.entidad.
    entidad = serializers.PrimaryKeyRelatedField(
        queryset=Entidad.objects.all(), required=False, allow_null=True
    )
    password_pendiente = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "rol",
            "entidad",
            "entidad_nombre",
            "is_active",
            "password_pendiente",
        ]

    def get_password_pendiente(self, obj):
        return not obj.has_usable_password()

    def validate(self, attrs):
        # Reusa la regla de negocio del modelo (usuario_entidad debe tener
        # entidad, los demas roles no pueden tenerla) -- ModelSerializer no
        # llama full_clean()/clean() automaticamente, mismo patron que
        # ProgramacionVisitaSerializer.validate().
        instancia = Usuario(
            pk=self.instance.pk if self.instance else None,
            username=attrs.get("username", self.instance.username if self.instance else ""),
            rol=attrs.get("rol", self.instance.rol if self.instance else ""),
            entidad=attrs.get("entidad", self.instance.entidad if self.instance else None),
        )
        try:
            instancia.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(getattr(exc, "message_dict", exc.messages))
        return attrs
