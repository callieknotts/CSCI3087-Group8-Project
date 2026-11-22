from entity.card import Card
from abc import ABC, abstractmethod

class CardRepository(ABC):
    @abstractmethod
    def save(self, card: Card):
            pass
    
    @abstractmethod
    def add(self,card: Card):
        pass

    @abstractmethod
    def get(self, card_id, deck_id):
        pass

    @abstractmethod
    def get_all_by_deck(self, deck_id):
        pass

    @abstractmethod
    def get_all_by_subdeck(self, deck_id,subdeck_id):
        pass
    @abstractmethod
    def delete(self, user_id, deck_id, card_id):
        pass