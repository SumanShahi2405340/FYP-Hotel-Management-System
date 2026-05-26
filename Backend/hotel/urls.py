# This file connects Django backend API URLs like /api/me/, /api/room-inventory/, and /api/room-price/.

from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from hotel.payments import esewa_views

from .views import (
    # Auth
    AdminLoginView,
    OTPRequestView,
    OTPVerifyView,
    AdminUpdatePasswordView,
    AdminProfileView,
    OwnerLoginTokenView,
    ReceptionistLoginTokenView,

    ReceptionistOTPRequestView,
    ReceptionistOTPVerifyView,
    ReceptionistUpdatePasswordView,
    public_hotel_room_summary,

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
    ResetOwnerCredentialsView,
    me,

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

    # Starred Notifications
    starred_notifications,
    star_notification,
    unstar_notification,

    # Staff & receptionist
    register_receptionist,
    get_hotel_receptionist,
    get_hotel_receptionist_info,
    get_hotel_staff_info,
    add_staff,
    delete_staff,

    # Room management
    RoomInventoryView,
    RoomPriceView,

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
    guest_notifications,
    guest_starred_promotions,
    guest_star_promotion,
    guest_unstar_promotion,
    hotel_guest_reviews,
    
    get_receptionists_by_hotel_id,
)

router = DefaultRouter()
router.register(r"hotels", HotelViewSet)
router.register(r"attendance", AttendanceViewSet, basename="attendance")
router.register(r"manage-bookings", ManageBookingsViewSet)
router.register(r"manage-payments", ManagePaymentsViewSet)

urlpatterns = [
    # ================= AUTH =================
    path("admin-login/", AdminLoginView.as_view(), name="admin-login"),
    path("token/", OwnerLoginTokenView.as_view(), name="owner-token"),
    path("receptionist/token/", ReceptionistLoginTokenView.as_view(), name="receptionist-token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("forgot-password/", OTPRequestView.as_view(), name="forgot-password"),
    path("verify-otp/", OTPVerifyView.as_view(), name="verify-otp"),
    path("update-password/", AdminUpdatePasswordView.as_view(), name="admin-update-password"),
    path("admin/profile/", AdminProfileView.as_view(), name="admin-profile"),

    # ================= CURRENT LOGGED-IN USER =================
    path("me/", me, name="me"),

    # ================= HOTEL =================
    # Hotel list/register: both slash and no-slash are kept so frontend fetch never fails due to URL style.
    path("hotels/register", RegisterHotelView.as_view()),
    path("hotels/register/", RegisterHotelView.as_view()),
    path("hotels", ListHotelsView.as_view()),
    path("hotels/", ListHotelsView.as_view()),
    path("hotels/<int:pk>/", DeleteHotelView.as_view()),
    path("hotels/<int:pk>/activate", ActivateHotelView.as_view()),
    path("hotels/<int:pk>/activate/", ActivateHotelView.as_view()),
    path("hotels/<int:pk>/deactivate", DeactivateHotelView.as_view()),
    path("hotels/<int:pk>/deactivate/", DeactivateHotelView.as_view()),
    path("hotels/<int:pk>/update/", HotelUpdateView.as_view()),
    path("hotels/<int:pk>/hprofile/", HotelProfileView.as_view()),
    path("hotels/<int:pk>/oprofile/", OwnerProfileView.as_view()),
    path("hotels/<int:pk>/reset-owner-credentials/", ResetOwnerCredentialsView.as_view()),

    # ================= ROOM INVENTORY AND PRICE =================
    path("room-inventory/", RoomInventoryView.as_view(), name="room-inventory"),
    path("room-price/", RoomPriceView.as_view(), name="room-price"),
    # Public endpoints for admin/public hotel profile pages.
    path("hotels/<int:hotel_id>/public-room-summary/", public_hotel_room_summary),
    path("hotels/<int:hotel_id>/public-room-images/", RoomImagesView.as_view()),

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

    # ================= STARRED NOTIFICATIONS =================
    path("starred-notifications/", starred_notifications),
    path("star-notification/", star_notification),
    path("star-notification/<str:announcement_type>/<int:announcement>/", unstar_notification),

    # ================= RECEPTIONIST PASSWORD RESET =================
    path("receptionist/forgot-password/", ReceptionistOTPRequestView.as_view()),
    path("receptionist/verify-otp/", ReceptionistOTPVerifyView.as_view()),
    path("receptionist/update-password/", ReceptionistUpdatePasswordView.as_view()),

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
    path("payments/esewa/initiate/", esewa_views.esewa_initiate),
    path("payments/esewa/verify/", esewa_views.esewa_verify),
    path("payments/<int:booking_id>/esewa/verify/", esewa_views.esewa_redirect_success),

    # ================= ROOM IMAGES =================
    path("room-images/", RoomImagesView.as_view()),
    path("room-images/<int:pk>/", SingleRoomImageView.as_view()),

    # ================= GUEST =================
    path("guest/register/", GuestRegisterView.as_view()),
    path("guest/login/", GuestLoginView.as_view()),
    path("guest/logout/", GuestLogoutView.as_view()),
    path("guest/profile/", GuestProfileView.as_view()),
    path("guest/forgot-password/", GuestForgotPasswordView.as_view()),
    path("guest/verify-otp/", GuestVerifyOTPView.as_view()),
    path("guest/update-password/", GuestUpdatePasswordView.as_view()),
    path("guest/token/refresh/", GuestTokenRefreshView.as_view()),

    # Guest notification offers
    path("guest/notifications/", guest_notifications, name="guest-notifications"),
    path("guest/starred-promotions/", guest_starred_promotions, name="guest-starred-promotions"),
    path("guest/star-promotion/", guest_star_promotion, name="guest-star-promotion"),
    path("guest/star-promotion/<int:promotion_id>/", guest_unstar_promotion, name="guest-unstar-promotion"),

    path("hotels/<int:hotel_id>/guest-rooms/", get_hotel_rooms_for_guest),
    path("hotels/<int:hotel_id>/guest-bookings/", get_hotel_bookings_for_guest),
    path("hotels/<int:hotel_id>/guest-reviews/", hotel_guest_reviews, name="hotel-guest-reviews"),

    path("hotels/<int:pk>/receptionists/", get_receptionists_by_hotel_id),


    # ================= ROUTER =================
    path("", include(router.urls)),
]