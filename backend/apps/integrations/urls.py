from django.urls import path

from .views import HolidaysView

urlpatterns = [
    path("holidays/", HolidaysView.as_view(), name="holidays"),
]
