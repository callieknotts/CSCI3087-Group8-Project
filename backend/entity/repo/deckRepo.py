from abc import ABC, abstractmethod
from typing import List, Optional
from backend.entity.deck import Deck
class DeckRepository(ABC):
    @abstractmethod
    def save(self, deck: Deck):
        pass
    @abstractmethod
    def add(deck: Deck):
        pass
    @abstractmethod
    def get(self,deck_id):
        pass
    @abstractmethod
    def get_all(self, user_id):
        pass
    @abstractmethod
    def exists_by_name(self,user_id,deckname):
        pass