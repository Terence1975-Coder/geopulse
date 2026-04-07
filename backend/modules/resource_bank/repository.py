from .schemas import ResourceItem


class InMemoryResourceBankRepository:
    def __init__(self) -> None:
        self._items: dict[str, ResourceItem] = {}

    def upsert_many(self, items: list[ResourceItem]) -> list[ResourceItem]:
        for item in items:
            self._items[item.id] = item
        return list(self._items.values())

    def list_all(self) -> list[ResourceItem]:
        return list(self._items.values())