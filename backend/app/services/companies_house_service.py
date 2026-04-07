import os
import httpx


class CompaniesHouseService:
    def __init__(self):
        self.base_url = os.getenv(
            "COMPANIES_HOUSE_BASE_URL",
            "https://api.company-information.service.gov.uk"
        )
        self.api_key = os.getenv("COMPANIES_HOUSE_API_KEY")

    def _auth(self):
        if not self.api_key:
            raise ValueError("COMPANIES_HOUSE_API_KEY is not configured")
        return (self.api_key, "")

    async def search_companies(self, query: str, items_per_page: int = 10):
        url = f"{self.base_url}/search/companies"
        params = {"q": query, "items_per_page": items_per_page}

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, params=params, auth=self._auth())
            response.raise_for_status()
            return response.json()

    async def get_company_profile(self, company_number: str):
        url = f"{self.base_url}/company/{company_number}"

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, auth=self._auth())
            response.raise_for_status()
            return response.json()

    async def get_registered_office_address(self, company_number: str):
        url = f"{self.base_url}/company/{company_number}/registered-office-address"

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, auth=self._auth())
            response.raise_for_status()
            return response.json()