from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .brasilapi import BrasilAPIError, get_holidays


class HolidaysView(APIView):
    """Lista os feriados nacionais de um ano, consumindo a BrasilAPI."""

    def get(self, request):
        year = request.query_params.get("year")
        if year is None or not year.isdigit():
            return Response(
                {"detail": "Informe um ano válido em ?year=YYYY."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            holidays = get_holidays(int(year))
        except BrasilAPIError:
            return Response(
                {"detail": "Não foi possível consultar os feriados no momento."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(holidays)
