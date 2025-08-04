import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import PDFDocument, UserVectorDB
from .utils import embed_pdf_and_store, query_user


@csrf_exempt
def register_view(request):
    if request.method == "POST":
        data = json.loads(request.body)
        u = User.objects.create_user(username=data["username"], password=data["password"])
        return JsonResponse({"status": "registered"}, status=201)
    return JsonResponse({"error": "POST only"}, status=400)


@csrf_exempt
def login_view(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user = authenticate(username=data["username"], password=data["password"])
        if user:
            login(request, user)
            UserVectorDB.objects.get_or_create(
                owner=user, defaults={"db_path": ""}
            )
            return JsonResponse({
                "status": "logged_in",
                "is_admin": user.is_staff  # ✅ pass flag here
            })
        return JsonResponse({"error": "invalid credentials"}, status=401)
    return JsonResponse({"error": "POST only"}, status=400)


@login_required
def logout_view(request):
    logout(request)
    return JsonResponse({"status": "logged_out"})


@csrf_exempt
@login_required
def upload_pdf_view(request):
    """Admin can upload for any user; normal users only for themselves."""
    if request.method == "POST":
        if request.user.is_staff:
            # Admin uploading for a target user
            user_id = request.POST.get("user_id")
            if not user_id:
                return JsonResponse({"error": "user_id required for admin"}, status=400)
            try:
                target = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({"error": "target user not found"}, status=404)
        else:
            # Normal user uploads for themselves
            target = request.user

        f = request.FILES.get("pdf")
        if not f:
            return JsonResponse({"error": "no file provided"}, status=400)

        doc = PDFDocument.objects.create(owner=target, file=f)
        embed_pdf_and_store(target, doc.file.path)

        return JsonResponse({"status": "uploaded", "uploaded_for": target.username})
    return JsonResponse({"error": "POST only"}, status=400)


@csrf_exempt
@login_required
def query_view(request):
    """Admin can query for any user's DB; normal users only for themselves."""
    if request.method == "POST":
        data = json.loads(request.body)
        question = data.get("question")
        if not question:
            return JsonResponse({"error": "question is required"}, status=400)

        # ✅ If admin, allow specifying user_id
        if request.user.is_staff and "user_id" in data:
            try:
                target = User.objects.get(id=data["user_id"])
            except User.DoesNotExist:
                return JsonResponse({"error": "target user not found"}, status=404)
        else:
            target = request.user

        answer = query_user(target, question)
        return JsonResponse({
            "answer": answer,
            "for_user": target.username,
            "requested_by_admin": request.user.is_staff
        })
    return JsonResponse({"error": "POST only"}, status=400)


@csrf_exempt
def list_users_with_pdfs(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)

    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    users_data = []
    users = User.objects.all().prefetch_related("pdfs")

    for i, user in enumerate(users, start=1):
        pdf_files = [pdf.file.name.split("/")[-1] for pdf in user.pdfs.all()]
        users_data.append({
            "s_no": i,
            "full_name": user.get_full_name() or user.username,
            "pdfs": pdf_files
        })

    return JsonResponse({"users": users_data})
