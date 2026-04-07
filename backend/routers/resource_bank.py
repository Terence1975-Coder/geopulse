from fastapi import APIRouter
from backend.modules.resource_bank.service import ResourceBankService

router = APIRouter(prefix="/resource-bank", tags=["resource-bank"])

service = ResourceBankService()


@router.get("/")
def list_resources():
    return {"resources": service.list_resources()}