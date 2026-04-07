from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4

router = APIRouter(prefix="/sources", tags=["sources"])

SOURCE_STORE = []


class SourcePasteRequest(BaseModel):
    text: str
    source_name: Optional[str] = None
    source_type: Optional[str] = "paste"


class SourceRecord(BaseModel):
    id: str
    source_name: Optional[str] = None
    source_type: Optional[str] = None
    text: str


@router.post("/paste")
async def paste_source(payload: SourcePasteRequest):
    record = {
        "id": str(uuid4()),
        "source_name": payload.source_name,
        "source_type": payload.source_type,
        "text": payload.text,
    }
    SOURCE_STORE.append(record)
    return {"message": "Source added", "record": record}


@router.get("")
async def list_sources():
    return {"count": len(SOURCE_STORE), "sources": SOURCE_STORE}