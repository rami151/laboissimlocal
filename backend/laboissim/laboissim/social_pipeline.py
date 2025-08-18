from django.contrib.auth import get_user_model

User = get_user_model()

def save_profile(backend, user, response, *args, **kwargs):
    if backend.name == 'google-oauth2':
        user.first_name = response.get('given_name', '')
        user.last_name = response.get('family_name', '')
        # Make sure to only update safe fields and handle any potential type conversions
        try:
            user.save(update_fields=['first_name', 'last_name'])
        except Exception as e:
            print(f"Error saving user profile: {e}")
            # If save fails, at least ensure name fields are saved
            User.objects.filter(id=user.id).update(
                first_name=response.get('given_name', ''),
                last_name=response.get('family_name', '')
            )
    return 

def prevent_duplicate_email(strategy, details, backend, uid, user=None, *args, **kwargs):
    email = details.get('email')
    if email:
        User = get_user_model()
        try:
            existing_user = User.objects.get(email=email)
            return {'user': existing_user}
        except User.DoesNotExist:
            pass
    return {} 