from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# HOTEL MODEL
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

    # Extra fields
    age = models.IntegerField(null=True, blank=True)
    owner_contact = models.CharField(max_length=20, null=True, blank=True)
    citizenship = models.CharField(max_length=50, null=True, blank=True)
    permanent_address = models.CharField(max_length=255, null=True, blank=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Active")
    registered_on = models.DateField(default=timezone.now)

    review_score = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    usage_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    # Add these fields for geolocation
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)

    # link hotel to user
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="hotel", null=True, blank=True)

    def __str__(self):
        return self.name
    
    # ----- Methods for activation/deactivation (added for unit testing) -----
    def activate(self):
        """Activate the hotel."""
        self.status = "Active"
        self.save(update_fields=['status'])

    def deactivate(self):
        """Deactivate the hotel."""
        self.status = "Inactive"
        self.save(update_fields=['status'])


# RECEPTIONIST MODEL
class Receptionist(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Inactive", "Inactive"),
    ]

    ROLE_CHOICES = [
        ("Receptionist", "Receptionist"),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="receptionists", null=True, blank=True)
    name = models.CharField(max_length=255)
    age = models.PositiveIntegerField(null=True, blank=True)
    email = models.EmailField()
    contact = models.CharField(max_length=20)
    permanent_address = models.CharField(max_length=255, null=True, blank=True)
    citizenship = models.CharField(max_length=50, null=True, blank=True)
    joined_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Active")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="Receptionist")

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="receptionist", null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.email})"


# Staff Model
class Staff(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Inactive", "Inactive"),
    ]

    hotel = models.ForeignKey("hotel.Hotel", on_delete=models.CASCADE, related_name="staff")
    name = models.CharField(max_length=255)
    age = models.PositiveIntegerField(null=True, blank=True)
    email = models.EmailField(unique=True)
    contact = models.CharField(max_length=20)
    permanent_address = models.CharField(max_length=255, null=True, blank=True)
    citizenship = models.CharField(max_length=50, null=True, blank=True, unique=True)
    joined_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Active")
    role = models.CharField(max_length=50, default="Staff")

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="staff",
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.name} ({self.email})"


# Attendance Model
class Attendance(models.Model):
    STATUS_CHOICES = [
        ("Present", "Present"),
        ("Absent", "Absent"),
    ]

    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, null=True, blank=True, related_name="attendance")
    receptionist = models.ForeignKey(Receptionist, on_delete=models.CASCADE, null=True, blank=True, related_name="attendance")
    date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=10, choices=[("Present","Present"),("Absent","Absent")])

    def __str__(self):
        if self.staff:
            return f"{self.staff.name} - {self.date} ({self.status})"
        elif self.receptionist:
            return f"{self.receptionist.name} - {self.date} ({self.status})"
        return f"Unknown - {self.date} ({self.status})"


# COMMISSION RULE MODEL
class CommissionRule(models.Model):
    rule_id = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    effective_date = models.DateField()

    def __str__(self):
        return f"{self.rule_id} - {self.name}"


# COMMISSION PAYMENT MODEL
class CommissionPayment(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="payments")
    payment_id = models.CharField(max_length=20)
    amount = models.CharField(max_length=20)
    status = models.CharField(max_length=20)
    start_due_date = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.payment_id} - {self.hotel.name} - {self.status}"


# ANNOUNCEMENTS
class SendAdminAnnouncement(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="admin_announcements", null=True, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AdminAnnouncement({self.message[:30]})"


class SendOwnerAnnouncement(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="owner_announcements", null=True, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OwnerAnnouncement({self.hotel.name}: {self.message[:30]})"


class SendReceptionistAnnouncement(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="receptionist_announcements", null=True, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ReceptionistAnnouncement({self.message[:30]})"


class OwnerStarredNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    announcement = models.IntegerField()  # Store announcement ID (can be from any announcement type)
    announcement_type = models.CharField(max_length=50, default='admin')  # 'admin' or 'receptionist'
    starred_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'announcement', 'announcement_type')

    def __str__(self):
        return f"{self.user.username if self.user else 'Anonymous'} starred announcement {self.announcement}"


# ROOM INVENTORY MODEL
class RoomInventory(models.Model):
    hotel = models.OneToOneField(Hotel, on_delete=models.CASCADE, related_name="inventory")
    normal_rooms = models.IntegerField(default=0)
    deluxe_rooms = models.IntegerField(default=0)
    suite_rooms = models.IntegerField(default=0)

    def __str__(self):
        return f"Inventory for {self.hotel.name}"


# ROOM PRICE MODEL
class RoomPrice(models.Model):
    hotel = models.OneToOneField(Hotel, on_delete=models.CASCADE, related_name="prices")
    normal_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deluxe_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    suite_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Prices for {self.hotel.name}"


# MAINTENANCE REQUEST MODEL
class ManageMaintenanceRequest(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("In Progress", "In Progress"),
        ("Resolved", "Resolved"),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="maintenance_requests", null=True, blank=True)
    room = models.CharField(max_length=100)
    issue = models.TextField()
    reported_by = models.CharField(max_length=100)
    date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")

    def __str__(self):
        return f"{self.room} - {self.issue} ({self.status})"


# PROMOTION MODEL
class Promotion(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="promotions")
    title = models.CharField(max_length=200)
    description = models.TextField()
    valid_from = models.DateField()
    valid_to = models.DateField()
    status = models.CharField(max_length=20, default="Upcoming")

    def __str__(self):
        return f"{self.title} ({self.hotel.name})"


# COMMISSION REPORT MODEL
class CommissionReport(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Paid", "Paid"),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="commission_reports")
    date = models.DateField()
    time = models.TimeField()
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} {self.time} - {self.rate} ({self.status})"


# BOOKINGS MODEL
class ManageBookings(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    contact = models.CharField(max_length=20)
    room = models.CharField(max_length=50)
    days = models.PositiveIntegerField()
    checkin = models.DateTimeField(null=True, blank=True)
    checkout = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default="Booked")
    created_at = models.DateTimeField(auto_now_add=True)

    def current_status(self):
        now = timezone.now()
        if self.checkout and now > self.checkout:
            return "Available"
        return self.status

    def save(self, *args, **kwargs):
        now = timezone.now()
        if self.checkout and now > self.checkout:
            self.status = "Available"
        else:
            self.status = "Booked"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.room}"


# PAYMENTS MODEL
class ManagePayments(models.Model):
    booking = models.ForeignKey(ManageBookings, on_delete=models.CASCADE, related_name="payments")
    name = models.CharField(max_length=100)
    service = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.name} - {self.service} - {self.amount}"


# ESEWA TRANSACTION MODEL
class EsewaTransaction(models.Model):
    booking = models.ForeignKey(ManageBookings, on_delete=models.CASCADE, related_name="esewa_transactions")
    transaction_uuid = models.CharField(max_length=100, unique=True)
    product_code = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default="Pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_uuid} - {self.status}"


# ============================================================
# ROOM IMAGE MODEL - For storing custom room images
# ============================================================
class RoomImage(models.Model):
    """
    Model to store images for specific rooms
    Each room can have up to 4 images
    Images are stored in: D:\HMS\Frontend\public\room_images\hotel_{id}\room_{room_number}\
    """
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="room_images")
    room_number = models.IntegerField()
    image = models.CharField(max_length=500)  # Store relative path as string
    order = models.IntegerField(default=0)    # To maintain image order (0-3)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['hotel', 'room_number', 'order']
        ordering = ['room_number', 'order']

    def __str__(self):
        return f"Room {self.room_number} - Image {self.order + 1}"
    


# GUEST MODEL
class Guest(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    contact = models.CharField(max_length=20, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    id_proof = models.CharField(max_length=100, null=True, blank=True)  # passport/citizenship no.
    joined_date = models.DateField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="guest", null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.email})"
    
    













































    
# from django.db import models
# from django.contrib.auth.models import User
# from django.utils import timezone
# # from hotel.models import Staff   

# # HOTEL MODEL
# class Hotel(models.Model):
#     STATUS_CHOICES = [
#         ("Active", "Active"),
#         ("Inactive", "Inactive"),
#     ]

#     name = models.CharField(max_length=255)
#     owner = models.CharField(max_length=255)
#     contact = models.CharField(max_length=255)
#     email = models.EmailField()
#     location = models.CharField(max_length=255)
#     pan = models.CharField(max_length=100)

#     # Extra fields
#     age = models.IntegerField(null=True, blank=True)
#     owner_contact = models.CharField(max_length=20, null=True, blank=True)
#     citizenship = models.CharField(max_length=50, null=True, blank=True)
#     permanent_address = models.CharField(max_length=255, null=True, blank=True)

#     status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Active")
#     registered_on = models.DateField(default=timezone.now)

#     review_score = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
#     usage_score = models.IntegerField(default=0)
#     created_at = models.DateTimeField(auto_now_add=True)

#     # link hotel to user
#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="hotel", null=True, blank=True)

#     def __str__(self):
#         return self.name
    

#  # ----- Methods for activation/deactivation (added for unit testing) -----
#     def activate(self):
#         """Activate the hotel."""
#         self.status = "Active"
#         self.save(update_fields=['status'])

#     def deactivate(self):
#         """Deactivate the hotel."""
#         self.status = "Inactive"
#         self.save(update_fields=['status'])

# # RECEPTIONIST MODEL
# class Receptionist(models.Model):
#     STATUS_CHOICES = [
#         ("Active", "Active"),
#         ("Inactive", "Inactive"),
#     ]

#     ROLE_CHOICES = [
#         ("Receptionist", "Receptionist"),
#     ]

#     hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="receptionists", null=True, blank=True)
#     name = models.CharField(max_length=255)
#     age = models.PositiveIntegerField(null=True, blank=True)
#     email = models.EmailField()
#     contact = models.CharField(max_length=20)
#     permanent_address = models.CharField(max_length=255, null=True, blank=True)
#     citizenship = models.CharField(max_length=50, null=True, blank=True)
#     joined_date = models.DateField(default=timezone.now)
#     status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Active")
#     role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="Receptionist")   #  new field

#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="receptionist", null=True, blank=True)

#     def __str__(self):
#         return f"{self.name} ({self.email})"



# #Staff Model
# class Staff(models.Model):
#     STATUS_CHOICES = [
#         ("Active", "Active"),
#         ("Inactive", "Inactive"),
#     ]

#     hotel = models.ForeignKey("hotel.Hotel", on_delete=models.CASCADE, related_name="staff")
#     name = models.CharField(max_length=255)
#     age = models.PositiveIntegerField(null=True, blank=True)
#     email = models.EmailField(unique=True)
#     contact = models.CharField(max_length=20)
#     permanent_address = models.CharField(max_length=255, null=True, blank=True)
#     citizenship = models.CharField(max_length=50, null=True, blank=True, unique=True)
#     joined_date = models.DateField(default=timezone.now)
#     status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Active")
#     role = models.CharField(max_length=50, default="Staff")

#     user = models.OneToOneField(
#         User,
#         on_delete=models.CASCADE,
#         related_name="staff",
#         null=True,
#         blank=True
#     )


#     def __str__(self):
#         return f"{self.name} ({self.email})"
    

# # attendance models.py
# class Attendance(models.Model):
#     STATUS_CHOICES = [
#         ("Present", "Present"),
#         ("Absent", "Absent"),
#     ]

#     staff = models.ForeignKey(Staff, on_delete=models.CASCADE, null=True, blank=True, related_name="attendance")
#     receptionist = models.ForeignKey(Receptionist, on_delete=models.CASCADE, null=True, blank=True, related_name="attendance")
#     date = models.DateField(default=timezone.now)
#     status = models.CharField(max_length=10, choices=[("Present","Present"),("Absent","Absent")])

#     def __str__(self):
#         if self.staff:
#             return f"{self.staff.name} - {self.date} ({self.status})"
#         elif self.receptionist:
#             return f"{self.receptionist.name} - {self.date} ({self.status})"
#         return f"Unknown - {self.date} ({self.status})"






# # COMMISSION RULE MODEL
# class CommissionRule(models.Model):
#     rule_id = models.CharField(max_length=10, unique=True)
#     name = models.CharField(max_length=100)
#     description = models.TextField()
#     effective_date = models.DateField()

#     def __str__(self):
#         return f"{self.rule_id} - {self.name}"


# # COMMISSION PAYMENT MODEL
# class CommissionPayment(models.Model):
#     hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="payments")
#     payment_id = models.CharField(max_length=20)
#     amount = models.CharField(max_length=20)
#     status = models.CharField(max_length=20)
#     start_due_date = models.CharField(max_length=20)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.payment_id} - {self.hotel.name} - {self.status}"


# # ANNOUNCEMENTS
# class SendAdminAnnouncement(models.Model):
#     hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="admin_announcements", null=True, blank=True)
#     message = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"AdminAnnouncement({self.message[:30]})"


# class SendOwnerAnnouncement(models.Model):
#     hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="owner_announcements",null=True, blank=True)
#     message = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"OwnerAnnouncement({self.hotel.name}: {self.message[:30]})"


# class SendReceptionistAnnouncement(models.Model):
#     hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="receptionist_announcements", null=True, blank=True)
#     message = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)


#     def __str__(self):
#         return f"ReceptionistAnnouncement({self.message[:30]})"


# class OwnerStarredNotification(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
#     announcement = models.ForeignKey(SendOwnerAnnouncement, on_delete=models.CASCADE)
#     starred_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         unique_together = ('user', 'announcement')

#     def __str__(self):
#         if self.user:
#             return f"{self.user.username} starred announcement {self.announcement.id}"
#         return f"Anonymous star for announcement {self.announcement.id}"


# # ROOM INVENTORY MODEL
# class RoomInventory(models.Model):
#     hotel = models.OneToOneField(Hotel, on_delete=models.CASCADE, related_name="inventory")
#     normal_rooms = models.IntegerField(default=0)
#     deluxe_rooms = models.IntegerField(default=0)
#     suite_rooms = models.IntegerField(default=0)

#     def __str__(self):
#         return f"Inventory for {self.hotel.name}"


# # ROOM PRICE MODEL
# class RoomPrice(models.Model):
#     hotel = models.OneToOneField(Hotel, on_delete=models.CASCADE, related_name="prices")
#     normal_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
#     deluxe_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
#     suite_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

#     def __str__(self):
#         return f"Prices for {self.hotel.name}"


# # MAINTENANCE REQUEST MODEL
# class ManageMaintenanceRequest(models.Model):
#     STATUS_CHOICES = [
#         ("Pending", "Pending"),
#         ("In Progress", "In Progress"),
#         ("Resolved", "Resolved"),
#     ]

#     hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="maintenance_requests", null=True, blank=True)
#     room = models.CharField(max_length=100)
#     issue = models.TextField()
#     reported_by = models.CharField(max_length=100)
#     date = models.DateField(default=timezone.now)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")

#     def __str__(self):
#         return f"{self.room} - {self.issue} ({self.status})"


# # PROMOTION MODEL
# class Promotion(models.Model):
#     hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="promotions")
#     title = models.CharField(max_length=200)
#     description = models.TextField()
#     valid_from = models.DateField()
#     valid_to = models.DateField()
#     status = models.CharField(max_length=20, default="Upcoming")

#     def __str__(self):
#         return f"{self.title} ({self.hotel.name})"



# # models.py
# class CommissionReport(models.Model):
#     STATUS_CHOICES = [
#         ("Pending", "Pending"),
#         ("Paid", "Paid"),
#     ]

#     hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="commission_reports")
#     date = models.DateField()
#     time = models.TimeField()
#     rate = models.DecimalField(max_digits=10, decimal_places=2)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.date} {self.time} - {self.rate} ({self.status})"





# class ManageBookings(models.Model):
#     name = models.CharField(max_length=100)
#     email = models.EmailField()
#     contact = models.CharField(max_length=20)
#     room = models.CharField(max_length=50)
#     days = models.PositiveIntegerField()
#     checkin = models.DateTimeField(null=True, blank=True)
#     checkout = models.DateTimeField(null=True, blank=True)
#     status = models.CharField(max_length=20, default="Booked")
#     created_at = models.DateTimeField(auto_now_add=True)

#     def current_status(self):
#         now = timezone.now()
#         if self.checkout and now > self.checkout:
#             return "Available"
#         return self.status

#     def save(self, *args, **kwargs):
#         now = timezone.now()
#         if self.checkout and now > self.checkout:
#             self.status = "Available"
#         else:
#             self.status = "Booked"
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return f"{self.name} - {self.room}"



# class ManagePayments(models.Model):
#     booking = models.ForeignKey(ManageBookings, on_delete=models.CASCADE, related_name="payments")
#     name = models.CharField(max_length=100)
#     service = models.CharField(max_length=100)
#     description = models.TextField(blank=True)
#     amount = models.DecimalField(max_digits=10, decimal_places=2)
#     date = models.DateTimeField(default=timezone.now)
    

#     def __str__(self):
#         return f"{self.name} - {self.service} - {self.amount}"





# class EsewaTransaction(models.Model):
#     booking = models.ForeignKey(ManageBookings, on_delete=models.CASCADE, related_name="esewa_transactions")
#     transaction_uuid = models.CharField(max_length=100, unique=True)
#     product_code = models.CharField(max_length=50)
#     amount = models.DecimalField(max_digits=10, decimal_places=2)
#     status = models.CharField(max_length=20, default="Pending")
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.transaction_uuid} - {self.status}"
