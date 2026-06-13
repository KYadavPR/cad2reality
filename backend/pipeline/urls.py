from django.urls import path
from . import views

app_name = 'pipeline'

urlpatterns = [
    path('health/', views.health_check, name='health'),
    path('upload/', views.upload_and_process, name='upload'),
    path('model/<str:filename>', views.serve_model, name='serve_model'),
    path('ar/<str:filename>', views.ar_viewer, name='ar_viewer'),
]
