# Register your models here.
from django.contrib import admin
from .models import Hotel

@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "owner",
        "email",
        "location",
        "status",
        "created_at",
        "age",                
        "owner_contact",      
        "citizenship",        
        "permanent_address",  
    )
    search_fields = (
        "name",
        "owner",
        "email",
        "location",
        "pan",
        "owner_contact",      # NEW
        "citizenship",        # NEW
        "permanent_address",  # NEW
    )
    list_filter = (
        "status",
        "location",
        "age",                # optional filter
    )

