"""Database connection using Supabase."""
from supabase import create_client, Client
from functools import lru_cache
from .config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """Get cached Supabase client instance."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


def get_supabase_admin_client() -> Client:
    """Get Supabase client with service role key for admin operations."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
