"""
Initialize the database with essential Polish words and lessons.
Run this script after setting up the database to populate it with initial data.
"""

import os
import sys
from pathlib import Path

# Add the parent directory to path to allow importing the app
parent_dir = str(Path(__file__).resolve().parent.parent)
sys.path.append(parent_dir)

from app import models, crud, schemas
from app.database import SessionLocal, engine

# Essential Polish words by category
ESSENTIAL_WORDS = [
    {
        "category": {
            "name": "Greetings & Basic Phrases",
            "description": "Essential expressions for everyday conversations"
        },
        "words": [
            {"polish": "Cześć", "english": "Hello/Hi", "part_of_speech": "greeting", "pronunciation": "chest",
             "difficulty_level": 1},
            {"polish": "Dzień dobry", "english": "Good morning/day", "part_of_speech": "greeting",
             "pronunciation": "jen dob-ri", "difficulty_level": 1},
            {"polish": "Dobry wieczór", "english": "Good evening", "part_of_speech": "greeting",
             "pronunciation": "dob-ri vye-choor", "difficulty_level": 1},
            {"polish": "Do widzenia", "english": "Goodbye", "part_of_speech": "greeting",
             "pronunciation": "do vee-dze-nya", "difficulty_level": 1},
            {"polish": "Dziękuję", "english": "Thank you", "part_of_speech": "phrase", "pronunciation": "jen-koo-ye",
             "difficulty_level": 1},
            {"polish": "Proszę", "english": "Please/You're welcome", "part_of_speech": "phrase",
             "pronunciation": "pro-she", "difficulty_level": 1},
            {"polish": "Przepraszam", "english": "Sorry/Excuse me", "part_of_speech": "phrase",
             "pronunciation": "psheh-pra-sham", "difficulty_level": 1},
            {"polish": "Tak", "english": "Yes", "part_of_speech": "adverb", "pronunciation": "tahk",
             "difficulty_level": 1},
            {"polish": "Nie", "english": "No", "part_of_speech": "adverb", "pronunciation": "nyeh",
             "difficulty_level": 1},
            {"polish": "Może", "english": "Maybe", "part_of_speech": "adverb", "pronunciation": "mo-zhe",
             "difficulty_level": 1},
            {"polish": "Dobrze", "english": "Good/OK", "part_of_speech": "adverb", "pronunciation": "dob-zhe",
             "difficulty_level": 1},
            {"polish": "Jak się masz", "english": "How are you", "part_of_speech": "phrase",
             "pronunciation": "yak shye mash", "difficulty_level": 1},
            {"polish": "Dobrze, dziękuję", "english": "I'm fine, thank you", "part_of_speech": "phrase",
             "pronunciation": "dob-zhe, jen-koo-ye", "difficulty_level": 1},
            {"polish": "Jak masz na imię", "english": "What's your name", "part_of_speech": "phrase",
             "pronunciation": "yak mash na ee-mye", "difficulty_level": 2},
            {"polish": "Miło cię poznać", "english": "Nice to meet you", "part_of_speech": "phrase",
             "pronunciation": "mee-wo che poz-nach", "difficulty_level": 2},
        ]
    },

    {
        "category": {
            "name": "Personal Pronouns & Common Verbs",
            "description": "Basic pronouns and essential verbs for simple sentences"
        },
        "words": [
            {"polish": "Ja", "english": "I", "part_of_speech": "pronoun", "pronunciation": "ya", "difficulty_level": 1},
            {"polish": "Ty", "english": "You (informal)", "part_of_speech": "pronoun", "pronunciation": "ti",
             "difficulty_level": 1},
            {"polish": "On", "english": "He", "part_of_speech": "pronoun", "pronunciation": "on",
             "difficulty_level": 1},
            {"polish": "Ona", "english": "She", "part_of_speech": "pronoun", "pronunciation": "ona",
             "difficulty_level": 1},
            {"polish": "My", "english": "We", "part_of_speech": "pronoun", "pronunciation": "mi",
             "difficulty_level": 1},
            {"polish": "Wy", "english": "You (plural)", "part_of_speech": "pronoun", "pronunciation": "vi",
             "difficulty_level": 1},
            {"polish": "Oni", "english": "They", "part_of_speech": "pronoun", "pronunciation": "oni",
             "difficulty_level": 1},
            {"polish": "Być", "english": "To be", "part_of_speech": "verb", "pronunciation": "bich",
             "difficulty_level": 1},
            {"polish": "Jestem", "english": "I am", "part_of_speech": "verb", "pronunciation": "yes-tem",
             "difficulty_level": 1},
            {"polish": "Jesteś", "english": "You are", "part_of_speech": "verb", "pronunciation": "yes-tesh",
             "difficulty_level": 1},
            {"polish": "Jest", "english": "He/She/It is", "part_of_speech": "verb", "pronunciation": "yest",
             "difficulty_level": 1},
            {"polish": "Mieć", "english": "To have", "part_of_speech": "verb", "pronunciation": "myetch",
             "difficulty_level": 1},
            {"polish": "Mam", "english": "I have", "part_of_speech": "verb", "pronunciation": "mam",
             "difficulty_level": 1},
            {"polish": "Iść", "english": "To go", "part_of_speech": "verb", "pronunciation": "eeshch",
             "difficulty_level": 1},
            {"polish": "Idę", "english": "I go/I am going", "part_of_speech": "verb", "pronunciation": "ee-deh",
             "difficulty_level": 1},
        ]
    },

    {
        "category": {
            "name": "Food & Drink",
            "description": "Essential vocabulary for ordering food and drinks"
        },
        "words": [
            {"polish": "Woda", "english": "Water", "part_of_speech": "noun", "pronunciation": "voda",
             "difficulty_level": 1},
            {"polish": "Kawa", "english": "Coffee", "part_of_speech": "noun", "pronunciation": "kava",
             "difficulty_level": 1},
            {"polish": "Herbata", "english": "Tea", "part_of_speech": "noun", "pronunciation": "her-bata",
             "difficulty_level": 1},
            {"polish": "Piwo", "english": "Beer", "part_of_speech": "noun", "pronunciation": "peevo",
             "difficulty_level": 1},
            {"polish": "Wino", "english": "Wine", "part_of_speech": "noun", "pronunciation": "veeno",
             "difficulty_level": 1},
            {"polish": "Chleb", "english": "Bread", "part_of_speech": "noun", "pronunciation": "hleb",
             "difficulty_level": 1},
            {"polish": "Mięso", "english": "Meat", "part_of_speech": "noun", "pronunciation": "myenso",
             "difficulty_level": 1},
            {"polish": "Ser", "english": "Cheese", "part_of_speech": "noun", "pronunciation": "ser",
             "difficulty_level": 1},
            {"polish": "Jajko", "english": "Egg", "part_of_speech": "noun", "pronunciation": "yaiko",
             "difficulty_level": 1},
            {"polish": "Zupa", "english": "Soup", "part_of_speech": "noun", "pronunciation": "zoopa",
             "difficulty_level": 1},
            {"polish": "Kanapka", "english": "Sandwich", "part_of_speech": "noun", "pronunciation": "ka-napka",
             "difficulty_level": 1},
            {"polish": "Restauracja", "english": "Restaurant", "part_of_speech": "noun",
             "pronunciation": "res-tau-ratsia", "difficulty_level": 2},
            {"polish": "Menu", "english": "Menu", "part_of_speech": "noun", "pronunciation": "menu",
             "difficulty_level": 1},
            {"polish": "Rachunek", "english": "Bill", "part_of_speech": "noun", "pronunciation": "ra-hoo-nek",
             "difficulty_level": 2},
            {"polish": "Smacznego", "english": "Enjoy your meal", "part_of_speech": "phrase",
             "pronunciation": "smach-nego", "difficulty_level": 1},
        ]
    },

    {
        "category": {
            "name": "Numbers",
            "description": "Basic numbers and counting"
        },
        "words": [
            {"polish": "Zero", "english": "Zero", "part_of_speech": "number", "pronunciation": "zero",
             "difficulty_level": 1},
            {"polish": "Jeden", "english": "One", "part_of_speech": "number", "pronunciation": "yeden",
             "difficulty_level": 1},
            {"polish": "Dwa", "english": "Two", "part_of_speech": "number", "pronunciation": "dva",
             "difficulty_level": 1},
            {"polish": "Trzy", "english": "Three", "part_of_speech": "number", "pronunciation": "tshi",
             "difficulty_level": 1},
            {"polish": "Cztery", "english": "Four", "part_of_speech": "number", "pronunciation": "chtery",
             "difficulty_level": 1},
            {"polish": "Pięć", "english": "Five", "part_of_speech": "number", "pronunciation": "pyench",
             "difficulty_level": 1},
            {"polish": "Sześć", "english": "Six", "part_of_speech": "number", "pronunciation": "sheshch",
             "difficulty_level": 1},
            {"polish": "Siedem", "english": "Seven", "part_of_speech": "number", "pronunciation": "shedem",
             "difficulty_level": 1},
            {"polish": "Osiem", "english": "Eight", "part_of_speech": "number", "pronunciation": "oshem",
             "difficulty_level": 1},
            {"polish": "Dziewięć", "english": "Nine", "part_of_speech": "number", "pronunciation": "jevyench",
             "difficulty_level": 1},
            {"polish": "Dziesięć", "english": "Ten", "part_of_speech": "number", "pronunciation": "jeshench",
             "difficulty_level": 1},
            {"polish": "Sto", "english": "Hundred", "part_of_speech": "number", "pronunciation": "sto",
             "difficulty_level": 1},
            {"polish": "Tysiąc", "english": "Thousand", "part_of_speech": "number", "pronunciation": "tishonts",
             "difficulty_level": 1},
            {"polish": "Pierwszy", "english": "First", "part_of_speech": "adjective", "pronunciation": "pyervshi",
             "difficulty_level": 1},
            {"polish": "Drugi", "english": "Second", "part_of_speech": "adjective", "pronunciation": "droogee",
             "difficulty_level": 1},
        ]
    },

    {
        "category": {
            "name": "Time & Date",
            "description": "Essential vocabulary for discussing time and dates"
        },
        "words": [
            {"polish": "Czas", "english": "Time", "part_of_speech": "noun", "pronunciation": "chas",
             "difficulty_level": 1},
            {"polish": "Godzina", "english": "Hour", "part_of_speech": "noun", "pronunciation": "go-jina",
             "difficulty_level": 1},
            {"polish": "Minuta", "english": "Minute", "part_of_speech": "noun", "pronunciation": "mi-nuta",
             "difficulty_level": 1},
            {"polish": "Dzień", "english": "Day", "part_of_speech": "noun", "pronunciation": "jen",
             "difficulty_level": 1},
            {"polish": "Tydzień", "english": "Week", "part_of_speech": "noun", "pronunciation": "ti-jen",
             "difficulty_level": 1},
            {"polish": "Miesiąc", "english": "Month", "part_of_speech": "noun", "pronunciation": "mye-shonts",
             "difficulty_level": 1},
            {"polish": "Rok", "english": "Year", "part_of_speech": "noun", "pronunciation": "rok",
             "difficulty_level": 1},
            {"polish": "Poniedziałek", "english": "Monday", "part_of_speech": "noun", "pronunciation": "po-nye-ja-wek",
             "difficulty_level": 2},
            {"polish": "Wtorek", "english": "Tuesday", "part_of_speech": "noun", "pronunciation": "ftorek",
             "difficulty_level": 1},
            {"polish": "Środa", "english": "Wednesday", "part_of_speech": "noun", "pronunciation": "shroda",
             "difficulty_level": 1},
            {"polish": "Czwartek", "english": "Thursday", "part_of_speech": "noun", "pronunciation": "chvartek",
             "difficulty_level": 1},
            {"polish": "Piątek", "english": "Friday", "part_of_speech": "noun", "pronunciation": "pyontek",
             "difficulty_level": 1},
            {"polish": "Sobota", "english": "Saturday", "part_of_speech": "noun", "pronunciation": "sobota",
             "difficulty_level": 1},
            {"polish": "Niedziela", "english": "Sunday", "part_of_speech": "noun", "pronunciation": "nye-jela",
             "difficulty_level": 1},
            {"polish": "Teraz", "english": "Now", "part_of_speech": "adverb", "pronunciation": "teraz",
             "difficulty_level": 1},
        ]
    },
]

SAMPLE_LESSONS = [
    {
        "title": "Introduction to Polish",
        "description": "Learn the basic Polish greetings and how to introduce yourself.",
        "difficulty_level": 1,
        "order_number": 1,
        "category_name": "Greetings & Basic Phrases",
        "words": ["Cześć", "Dzień dobry", "Jak się masz", "Dziękuję", "Proszę", "Przepraszam"]
    },
    {
        "title": "Yes, No, and Maybe",
        "description": "Learn how to agree, disagree, and express uncertainty in Polish.",
        "difficulty_level": 1,
        "order_number": 2,
        "category_name": "Greetings & Basic Phrases",
        "words": ["Tak", "Nie", "Może", "Dobrze", "Przepraszam"]
    },
    {
        "title": "Basic Pronouns",
        "description": "Learn the essential personal pronouns in Polish.",
        "difficulty_level": 1,
        "order_number": 1,
        "category_name": "Personal Pronouns & Common Verbs",
        "words": ["Ja", "Ty", "On", "Ona", "My"]
    },
    {
        "title": "The Verb 'To Be'",
        "description": "Learn how to use the verb 'to be' in Polish.",
        "difficulty_level": 1,
        "order_number": 2,
        "category_name": "Personal Pronouns & Common Verbs",
        "words": ["Być", "Jestem", "Jesteś", "Jest"]
    },
{
        "title": "Basic Verbs",
        "description": "Learn how to use essential verbs in Polish.",
        "difficulty_level": 1,
        "order_number": 2,
        "category_name": "Personal Pronouns & Common Verbs",
        "words": ["Być", "Mieć", "Iść", "Jeść", "Pić"]
    },
    {
        "title": "Ordering Drinks",
        "description": "Learn how to order drinks in Polish.",
        "difficulty_level": 1,
        "order_number": 1,
        "category_name": "Food & Drink",
        "words": ["Woda", "Kawa", "Herbata", "Piwo", "Wino"]
    },
    {
        "title": "Counting from 1 to 10",
        "description": "Learn the numbers from 1 to 10 in Polish.",
        "difficulty_level": 1,
        "order_number": 1,
        "category_name": "Numbers",
        "words": ["Jeden", "Dwa", "Trzy", "Cztery", "Pięć", "Sześć", "Siedem", "Osiem", "Dziewięć", "Dziesięć"]
    },
    {
        "title": "Days of the Week",
        "description": "Learn the days of the week in Polish.",
        "difficulty_level": 1,
        "order_number": 1,
        "category_name": "Time & Date",
        "words": ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"]
    },
    {
        "title": "Ordering food",
        "description": "Learn names of common foods",
        "difficulty_level": 1,
        "order_number": 2,
        "category_name": "Food",
        "words": ["chleb", "mięso", "ziemniak", "zupa"]
        },
]


def init_db():
    """Initialize the database with essential Polish words and sample lessons."""
    # Create tables if they don't exist
    models.Base.metadata.create_all(bind=engine)

    # Create a database session
    db = SessionLocal()

    try:
        print("Initializing database...")

        # Add categories and words
        category_mappings = {}  # To keep track of category ids

        for category_data in ESSENTIAL_WORDS:
            # Check if category already exists
            category_name = category_data["category"]["name"]
            existing_category = db.query(models.Category).filter(models.Category.name == category_name).first()

            if existing_category:
                print(f"Category already exists: {category_name}")
                category_mappings[category_name] = existing_category.id
                continue

            # Create category
            category_schema = schemas.CategoryCreate(
                name=category_data["category"]["name"],
                description=category_data["category"]["description"]
            )
            db_category = crud.create_category(db, category_schema)
            category_mappings[db_category.name] = db_category.id

            print(f"Created category: {db_category.name}")

            # Add words for this category
            for word_data in category_data["words"]:
                # Check if word already exists
                existing_word = db.query(models.Word).filter(
                    models.Word.polish == word_data["polish"],
                    models.Word.english == word_data["english"]
                ).first()

                if existing_word:
                    print(f"Word already exists: {existing_word.polish}")
                    continue

                word_schema = schemas.WordCreate(
                    polish=word_data["polish"],
                    english=word_data["english"],
                    part_of_speech=word_data["part_of_speech"],
                    pronunciation=word_data["pronunciation"],
                    difficulty_level=word_data["difficulty_level"],
                    category_id=db_category.id
                )
                db_word = crud.create_word(db, word_schema)
                print(f"Added word: {db_word.polish} ({db_word.english})")

    except Exception as e:


        print(f"Error initializing database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()