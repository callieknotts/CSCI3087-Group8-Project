from uuid import UUID
from entity.repo.subdeckRepo import SubDeckRepository
from entity.subdeck import SubDeck
class CreateSubDeck:
    def __init__(self, sub_deck_repo: SubDeckRepository):
        self.sub_deck_repo=sub_deck_repo
    def execute(self,
                user_id:UUID,
                deck_id:UUID,
                subdeckname: str
                ):
            if subdeckname==None:
                raise ValueError("needs a subdeckname")
            if self.sub_deck_repo.exists_by_name(user_id=user_id,deck_id=deck_id,subdeckname=subdeckname):
                raise ValueError("can't have the same name")
            sub_deck=SubDeck.create(user_id=user_id,deck_id=deck_id,subdeckname=subdeckname)
            self.sub_deck_repo.add(sub_deck)
            return sub_deck
        
        


    
