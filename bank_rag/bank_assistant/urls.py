from django.urls import path
from .views import register_view, login_view, logout_view, upload_pdf_view, query_view, list_users_with_pdfs

urlpatterns = [
    path("register/", register_view),
    path("login/", login_view),
    path("logout/", logout_view),
    path("upload_pdf/", upload_pdf_view),
    path("query/", query_view),
    path("list_users/", list_users_with_pdfs),   
]