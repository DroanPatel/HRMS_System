from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """?page=2&page_size=20 . Dropdown loaders may ask for up to 500 rows at once."""
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 500
