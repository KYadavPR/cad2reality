from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class OTPVerification(models.Model):
    user = models.OneToOneField(
        user,
        on_delete=models.CASCADE
    )

    otp = models.CharField(max_length = 6)

    is_verified = models.BooleanField(default = False)

    created_at = models.DateTimeField(
        auto_now_add = True
    )

    def __str__(self):
        return self.user.email