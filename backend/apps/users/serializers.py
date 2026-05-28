from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    """Representação pública de um usuário (sem dados sensíveis)."""

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name")


class RegisterSerializer(serializers.ModelSerializer):
    """Cria um usuário novo, validando a senha e armazenando-a com hash."""

    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "first_name", "last_name")

    def create(self, validated_data):
        # create_user aplica o hash na senha; nunca a salvamos em texto puro.
        return User.objects.create_user(**validated_data)
