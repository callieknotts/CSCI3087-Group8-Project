from abc import ABC, abstractmethod
from typing import List, Optional
from entity.subdeck import SubDeck
from uuid import UUID
class SubDeckRepository(ABC):
    @abstractmethod
    def save(self, subdeck: SubDeck):
        pass
    @abstractmethod
    def add(self, subdeck: SubDeck):
        pass
    @abstractmethod
    def get(self, subdeck_id, deck_id, user_id):
        pass
    @abstractmethod
    def get_all(self, user_id, deck_id):
        pass
    @abstractmethod
    def exists_by_name(self,deck_id,deckname):
        pass