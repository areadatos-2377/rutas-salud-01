from rest_framework import serializers

from .models import Usuario


class UsuarioMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "username", "first_name", "last_name", "rol", "entidad"]
