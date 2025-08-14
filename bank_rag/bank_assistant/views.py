import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from .models import PDFDocument, UserVectorDB
from .utils import embed_pdf_and_store, query_user, query_all_users

@api_view(['POST'])
def register_view(request):
    """Register a new user."""
    data = request.data
    try:
        user = User.objects.create_user(
            username=data.get("username"),
            password=data.get("password")
        )
        return Response({"status": "registered"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_view(request):
    """Login a user and create/get their vector DB."""
    data = request.data
    user = authenticate(
        username=data.get("username"),
        password=data.get("password")
    )
    if user:
        login(request, user)
        UserVectorDB.objects.get_or_create(
            owner=user,
            defaults={"db_path": ""}
        )
        return Response({
            "status": "logged_in",
            "is_admin": user.is_staff
        }, status=status.HTTP_200_OK)
    return Response({"error": "invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout the authenticated user."""
    logout(request)
    return Response({"status": "logged_out"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_pdf_view(request):
    """Admin can upload for any user; normal users only for themselves."""
    data = request.data
    files = request.FILES

    if request.user.is_staff:
        user_id = data.get("user_id")
        if not user_id:
            return Response({"error": "user_id required for admin"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "target user not found"}, status=status.HTTP_404_NOT_FOUND)
    else:
        target = request.user

    f = files.get("pdf")
    if not f:
        return Response({"error": "no file provided"}, status=status.HTTP_400_BAD_REQUEST)

    doc = PDFDocument.objects.create(owner=target, file=f)
    embed_pdf_and_store(target, doc.file.path)

    return Response({
        "status": "uploaded",
        "uploaded_for": target.username
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def query_view(request):
    """Admin can query for any user's DB or all users; normal users only for themselves."""
    data = request.data
    question = data.get("question")
    if not question:
        return Response({"error": "question is required"}, status=status.HTTP_400_BAD_REQUEST)

    if request.user.is_staff:
        if "user_id" in data and data["user_id"]:
            try:
                target = User.objects.get(id=data["user_id"])
                answer = query_user(target, question)
                return Response({
                    "answer": answer,
                    "for_user": target.username,
                    "requested_by_admin": True
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({"error": "target user not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            answer = query_all_users(question)
            return Response({
                "answer": answer,
                "for_user": "all_users",
                "requested_by_admin": True
            }, status=status.HTTP_200_OK)
    else:
        target = request.user
        answer = query_user(target, question)
        return Response({
            "answer": answer,
            "for_user": target.username,
            "requested_by_admin": False
        }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def list_users_with_pdfs(request):
    """List all users with their PDFs, accessible only to admin users."""
    users_data = []
    users = User.objects.all().prefetch_related("pdfs")

    for i, user in enumerate(users, start=1):
        pdf_files = [pdf.file.name.split("/")[-1] for pdf in user.pdfs.all()]
        users_data.append({
            "s_no": i,
            "full_name": user.get_full_name() or user.username,
            "pdfs": pdf_files
        })

    return Response({"users": users_data}, status=status.HTTP_200_OK)