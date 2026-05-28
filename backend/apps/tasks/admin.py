from django.contrib import admin

from .models import Task, TaskShare

admin.site.register(Task)
admin.site.register(TaskShare)
