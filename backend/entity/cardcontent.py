from dataclasses import dataclass
# from typing import Union
# from enum import Enum
# from uuid import UUID
@dataclass
class CardSide:
    text: str | None = None
    image_key: str | None = None

    def __post_init__(self):
        if self.text is not None and not self.text.strip():
            raise ValueError("Text cannot be empty")

        if self.image_key is not None and not self.image_key.strip():
            raise ValueError("Image reference cannot be empty")

        if self.text is None and self.image_key is None:
            raise ValueError("A card side must contain text, an image, or both")

@dataclass
class CardContent:
    front: CardSide
    back: CardSide
# maybe math use Latex for it to work properly, think about later
# class ContentType(str,Enum):
#     TEXT="text"
#     AUDIO="audio"
#     IMAGE="image"
#     VOICE="voice"
# @dataclass
# class BasicContent:
#     front: str
#     back: str

# @dataclass
# class ContentBlock:
#     content_type: ContentType
#     data: dict


# @dataclass
# class CardSide:
#     blocks: list[ContentBlock]

# @dataclass
# class MathContent:
#     question: str
#     answer: str
#     explanation: str | None = None


# @dataclass
# class LanguageContent:
#     word: str
#     translation: str
#     pronunciation: str | None = None


# CardContent = Union[
#     BasicContent,
#     # MathContent,
#     # LanguageContent
# ]