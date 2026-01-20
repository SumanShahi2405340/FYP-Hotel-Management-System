# from django.db import models

# class Hotel(models.Model):
#     name = models.CharField(max_length=255)
#     owner = models.CharField(max_length=255)
#     contact = models.CharField(max_length=255)
#     email = models.EmailField()
#     location = models.CharField(max_length=255)
#     pan = models.CharField(max_length=100)

#     is_active = models.BooleanField(default=True)
#     review_score = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
#     usage_score = models.IntegerField(default=0)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name


from django.db import models

class Hotel(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Inactive", "Inactive"),
    ]

    name = models.CharField(max_length=255)
    owner = models.CharField(max_length=255)
    contact = models.CharField(max_length=255)
    email = models.EmailField()
    location = models.CharField(max_length=255)
    pan = models.CharField(max_length=100)

    # NEW FIELDS
    age = models.IntegerField(null=True, blank=True)
    owner_contact = models.CharField(max_length=20, null=True, blank=True)
    citizenship = models.CharField(max_length=50, null=True, blank=True)
    permanent_address = models.CharField(max_length=255, null=True, blank=True)

    # Replace is_active with status field
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Active")

    review_score = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    usage_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    


 
