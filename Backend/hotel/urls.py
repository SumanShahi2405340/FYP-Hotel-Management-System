from django.urls import path, include
from rest_framework.routers import DefaultRouter
from hotel.payments import esewa_views

from .views import (
    # Auth
    AdminLoginView,
    OTPRequestView,
    OTPVerifyView,
    AdminUpdatePasswordView,   # 🔥 NEW

    OwnerOTPRequestView,
    OwnerOTPVerifyView,
    OwnerUpdatePasswordView,

    # Hotel
    HotelViewSet,
    RegisterHotelView,
    ListHotelsView,
    ActivateHotelView,
    DeactivateHotelView,
    DeleteHotelView,
    HotelUpdateView,
    HotelProfileView,
    OwnerProfileView,

    # Commission
    CommissionRuleView,
    get_active_hotels,
    confirm_payments,
    track_commission_revenue,

    # Announcement
    send_announcement,
    recent_announcements,
    owner_send_announcement,
    owner_recent_announcements,

    # Staff & receptionist
    register_receptionist,
    get_hotel_receptionist,
    get_hotel_receptionist_info,
    get_hotel_staff_info,
    add_staff,
    delete_staff,

    # Others
    PromotionListCreateView,
    PromotionDetailView,
    CommissionReportListCreateView,
    ManageBookingsViewSet,
    AttendanceViewSet,
    ManagePaymentsViewSet,

    # Room Images
    RoomImagesView,
    SingleRoomImageView,

    # Guest
    GuestRegisterView,
    GuestLoginView,
    GuestLogoutView,
    GuestProfileView,
    GuestForgotPasswordView,
    GuestVerifyOTPView,
    GuestUpdatePasswordView,
    GuestTokenRefreshView,
    get_hotel_bookings_for_guest,
    get_hotel_rooms_for_guest,
)

# Router
router = DefaultRouter()
router.register(r'hotels', HotelViewSet)
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'manage-bookings', ManageBookingsViewSet)
router.register(r'manage-payments', ManagePaymentsViewSet)

urlpatterns = [

    # ================= AUTH =================
    path('admin-login/', AdminLoginView.as_view(), name='admin-login'),
    path('forgot-password/', OTPRequestView.as_view(), name='forgot-password'),
    path('verify-otp/', OTPVerifyView.as_view(), name='verify-otp'),

    # 🔥 NEW RESET PASSWORD API
    path('update-password/', AdminUpdatePasswordView.as_view(), name='admin-update-password'),

    # ================= HOTEL =================
    path("hotels/register", RegisterHotelView.as_view()),
    path("hotels", ListHotelsView.as_view()),
    path("hotels/<int:pk>/", DeleteHotelView.as_view()),
    path("hotels/<int:pk>/activate", ActivateHotelView.as_view()),
    path("hotels/<int:pk>/deactivate", DeactivateHotelView.as_view()),
    path("hotels/<int:pk>/update/", HotelUpdateView.as_view()),
    path("hotels/<int:pk>/hprofile/", HotelProfileView.as_view()),
    path("hotels/<int:pk>/oprofile/", OwnerProfileView.as_view()),

    # ================= COMMISSION =================
    path("commission-rules/", CommissionRuleView.as_view()),
    path("commission-payments/active-hotels/", get_active_hotels),
    path("commission-payments/confirm/", confirm_payments),
    path("commission-revenue/", track_commission_revenue),

    # ================= ANNOUNCEMENTS =================
    path("send-announcement/", send_announcement),
    path("recent-announcements/", recent_announcements),
    path("owner-send-announcement/", owner_send_announcement),
    path("owner-recent-announcements/", owner_recent_announcements),

    # ================= OWNER AUTH =================
    path('owner/forgot-password/', OwnerOTPRequestView.as_view()),
    path('owner/verify-otp/', OwnerOTPVerifyView.as_view()),
    path('owner/update-password/', OwnerUpdatePasswordView.as_view()),

    # ================= STAFF =================
    path("receptionist/register/", register_receptionist),
    path("hotel/receptionist/", get_hotel_receptionist),
    path("hotel/receptionist-info/", get_hotel_receptionist_info),

    path("hotel/staff-info/", get_hotel_staff_info),
    path("hotel/add-staff/", add_staff),
    path("staff/<int:pk>/delete/", delete_staff),

    # ================= PROMOTION =================
    path("promotions/", PromotionListCreateView.as_view()),
    path("promotions/<int:pk>/", PromotionDetailView.as_view()),

    # ================= COMMISSION REPORT =================
    path("commission-reports/", CommissionReportListCreateView.as_view()),

    # ================= PAYMENTS =================
    path('payments/esewa/initiate/', esewa_views.esewa_initiate),
    path('payments/esewa/verify/', esewa_views.esewa_verify),
    path('payments/<int:booking_id>/esewa/verify/', esewa_views.esewa_redirect_success),

    # ================= ROOM IMAGES =================
    path('room-images/', RoomImagesView.as_view()),
    path('room-images/<int:pk>/', SingleRoomImageView.as_view()),

    # ================= GUEST =================
    path('guest/register/', GuestRegisterView.as_view()),
    path('guest/login/', GuestLoginView.as_view()),
    path('guest/logout/', GuestLogoutView.as_view()),
    path('guest/profile/', GuestProfileView.as_view()),
    path('guest/forgot-password/', GuestForgotPasswordView.as_view()),
    path('guest/verify-otp/', GuestVerifyOTPView.as_view()),
    path('guest/update-password/', GuestUpdatePasswordView.as_view()),
    path('guest/token/refresh/', GuestTokenRefreshView.as_view()),

    path('hotels/<int:hotel_id>/guest-rooms/', get_hotel_rooms_for_guest),
    path('hotels/<int:hotel_id>/guest-bookings/', get_hotel_bookings_for_guest),

    # ================= ROUTER =================
    path('', include(router.urls)),
]