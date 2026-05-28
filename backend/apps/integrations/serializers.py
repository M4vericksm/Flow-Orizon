from rest_framework import serializers


class HolidaySerializer(serializers.Serializer):
    """Formato de um feriado retornado pela BrasilAPI."""

    date = serializers.DateField()
    name = serializers.CharField()
    type = serializers.CharField()
