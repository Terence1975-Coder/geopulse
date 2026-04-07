class ResourceBankService:
    def __init__(self) -> None:
        self._resources = []

    def list_resources(self):
        return self._resources

    def add_resource(self, resource):
        self._resources.append(resource)
        return resource